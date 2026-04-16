import Appointment from '../models/Appointment.js';
import { ApiError, ApiResponse } from '@healthbridge/shared';
import axios from 'axios';

const normalizeBaseUrl = (url) => String(url || '').replace(/\/$/, '');
const doctorBaseUrl = () => normalizeBaseUrl(process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003');
const internalKey = () => process.env.INTERNAL_SERVICE_SECRET;

const doctorClient = axios.create({ timeout: 8000 });

const getDoctorBaseUrlCandidates = () => {
  const configured = normalizeBaseUrl(process.env.DOCTOR_SERVICE_URL);
  const candidates = [configured, 'http://localhost:3003', 'http://doctor-service:3003']
    .filter(Boolean)
    .map((url) => normalizeBaseUrl(url));

  return [...new Set(candidates)];
};

const requestDoctorService = async (path, config = {}) => {
  if (!internalKey()) {
    throw new ApiError(500, 'Appointment service is missing INTERNAL_SERVICE_SECRET configuration');
  }

  let lastErr;
  for (const baseUrl of getDoctorBaseUrlCandidates()) {
    const url = `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
    try {
      const res = await doctorClient.request({
        url,
        ...config,
        headers: {
          'x-internal-service-key': internalKey(),
          ...(config.headers || {}),
        },
      });
      return res.data;
    } catch (err) {
      lastErr = err;
      // Auth/validation errors are definitive; do not retry other hosts.
      if (err?.response?.status && err.response.status < 500) break;
    }
  }

  const status = lastErr?.response?.status || 500;
  const message = lastErr?.response?.data?.message || lastErr?.message || 'Doctor service request failed';
  throw new ApiError(status, message);
};

const getDoctorAvailabilityInternal = async (doctorId) => {
  return requestDoctorService(`/internal/availability/${doctorId}`, { method: 'GET' });
};

const reserveSlotInternal = async ({
  doctorId,
  dayOfWeek,
  timeSlotId,
  patientId,
  patientName,
  appointmentId,
}) => {
  return requestDoctorService(`/internal/availability/${doctorId}/reserve`, {
    method: 'POST',
    data: { dayOfWeek, timeSlotId, patientId, patientName, appointmentId },
  });
};

const releaseSlotInternal = async ({ doctorId, dayOfWeek, timeSlotId, appointmentId }) => {
  return requestDoctorService(`/internal/availability/${doctorId}/release`, {
    method: 'POST',
    data: { dayOfWeek, timeSlotId, appointmentId },
  });
};

const assertRole = (req, role) => String(req.user?.role || '') === role;

// Patient reads doctor's availability (sanitized) via appointment-service proxy
// GET /doctors/:doctorId/availability
export const getDoctorAvailabilityForBooking = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const payload = await getDoctorAvailabilityInternal(doctorId);
    res.status(200).json(new ApiResponse(200, payload?.data ?? payload, 'Availability retrieved'));
  } catch (err) {
    next(err);
  }
};

// POST /appointments (Patient)
export const createAppointment = async (req, res, next) => {
  try {
    if (!assertRole(req, 'Patient')) throw new ApiError(403, 'Only Patients can create appointments');

    const { doctorId, dayOfWeek, timeSlotId, startTime, endTime, reason, notes, patientPhone } = req.body || {};

    if (!doctorId || !dayOfWeek || !timeSlotId || !startTime || !endTime) {
      throw new ApiError(400, 'doctorId, dayOfWeek, timeSlotId, startTime, endTime are required');
    }

    // Create appointment id first so we can atomically reserve in doctor-service
    const appt = new Appointment({
      doctorId,
      patientId: req.user.id,
      patientName: req.user?.name,
      patientPhone,
      dayOfWeek,
      timeSlotId,
      startTime,
      endTime,
      reason,
      notes,
      status: 'Pending',
    });

    await appt.validate();

    // Reserve slot in doctor-service (atomic, prevents double booking)
    await reserveSlotInternal({
      doctorId,
      dayOfWeek,
      timeSlotId,
      patientId: req.user.id,
      patientName: req.user?.name,
      appointmentId: appt._id,
    });

    try {
      await appt.save();
    } catch (dbErr) {
      // If we fail to save locally, release the slot to avoid dead lock
      await releaseSlotInternal({ doctorId, dayOfWeek, timeSlotId, appointmentId: appt._id }).catch(() => {});
      throw dbErr;
    }

    res.status(201).json(new ApiResponse(201, appt, 'Appointment created (Pending)'));
  } catch (err) {
    next(err);
  }
};

// GET /appointments/mine (Patient)
export const getMyAppointments = async (req, res, next) => {
  try {
    if (!assertRole(req, 'Patient')) throw new ApiError(403, 'Only Patients can view this list');
    const appts = await Appointment.find({ patientId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, appts, 'Appointments retrieved'));
  } catch (err) {
    next(err);
  }
};

// GET /appointments/doctor (Doctor)
export const getDoctorAppointments = async (req, res, next) => {
  try {
    if (!assertRole(req, 'Doctor')) throw new ApiError(403, 'Only Doctors can view this list');

    // Your doctor-service stores doctor profile linked by userId.
    // In this service we don’t have that mapping, so doctorId must be provided (from frontend / gateway).
    const { doctorId } = req.query;
    if (!doctorId) throw new ApiError(400, 'doctorId query param is required');

    const appts = await Appointment.find({ doctorId }).sort({ createdAt: -1 });
    res.status(200).json(new ApiResponse(200, appts, 'Doctor appointments retrieved'));
  } catch (err) {
    next(err);
  }
};

// POST /appointments/:id/cancel (Patient) - only before doctor decision
export const cancelAppointmentByPatient = async (req, res, next) => {
  try {
    if (!assertRole(req, 'Patient')) throw new ApiError(403, 'Only Patients can cancel appointments');

    const { id } = req.params;
    const appt = await Appointment.findById(id);
    if (!appt) throw new ApiError(404, 'Appointment not found');
    if (String(appt.patientId) !== String(req.user.id)) throw new ApiError(403, 'Not allowed');

    if (appt.status !== 'Pending') {
      throw new ApiError(409, `Cannot cancel appointment in status: ${appt.status}`);
    }

    appt.status = 'Cancelled';
    appt.cancelledAt = new Date();
    await appt.save();

    // Release slot so others can book
    await releaseSlotInternal({
      doctorId: appt.doctorId,
      dayOfWeek: appt.dayOfWeek,
      timeSlotId: appt.timeSlotId,
      appointmentId: appt._id,
    }).catch(() => {});

    res.status(200).json(new ApiResponse(200, appt, 'Appointment cancelled'));
  } catch (err) {
    next(err);
  }
};

// POST /appointments/:id/decision (Doctor) body: { decision: 'accept'|'reject', note? }
export const doctorDecision = async (req, res, next) => {
  try {
    if (!assertRole(req, 'Doctor')) throw new ApiError(403, 'Only Doctors can decide appointments');

    const { id } = req.params;
    const { decision, note, doctorId } = req.body || {};
    if (!decision || !['accept', 'reject'].includes(String(decision).toLowerCase())) {
      throw new ApiError(400, "decision must be 'accept' or 'reject'");
    }
    if (!doctorId) throw new ApiError(400, 'doctorId is required (doctor identity for this service)');

    const appt = await Appointment.findById(id);
    if (!appt) throw new ApiError(404, 'Appointment not found');
    if (String(appt.doctorId) !== String(doctorId)) throw new ApiError(403, 'Not allowed');

    if (appt.status !== 'Pending') {
      throw new ApiError(409, `Cannot decide appointment in status: ${appt.status}`);
    }

    const normalized = String(decision).toLowerCase();
    appt.status = normalized === 'accept' ? 'Accepted' : 'Rejected';
    appt.doctorDecisionNote = note;
    appt.decidedAt = new Date();
    await appt.save();

    if (appt.status === 'Rejected') {
      await releaseSlotInternal({
        doctorId: appt.doctorId,
        dayOfWeek: appt.dayOfWeek,
        timeSlotId: appt.timeSlotId,
        appointmentId: appt._id,
      }).catch(() => {});
    }

    res.status(200).json(new ApiResponse(200, appt, `Appointment ${appt.status.toLowerCase()}`));
  } catch (err) {
    next(err);
  }
};

// ─── [INTERNAL API] Get appointment by ID (for telemedicine service) ──
export const getAppointmentByIdInternal = async (req, res) => {
    try {
        const { appointmentId } = req.params;

        if (!appointmentId) {
            return res.status(400).json({ message: 'appointmentId is required' });
        }

        const appointment = await Appointment.findById(appointmentId);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.status(200).json({ 
            data: appointment
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── [INTERNAL API] Get patient online appointments by userId ──
export const getPatientOnlineAppointments = async (req, res) => {
    try {
        const patientId = req.user.id;

        const appointments = await Appointment.find({ 
            patientId,
            appointmentType: 'online'
        }).sort({ appointmentDate: -1 });

        res.status(200).json({ 
            count: appointments.length,
            appointments 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get online appointments for doctor (Telemedicine) ──
export const getDoctorOnlineAppointments = async (req, res) => {
    try {
        const doctorId = req.user.id;

        const appointments = await Appointment.find({ 
            doctorId,
            appointmentType: 'online'
        }).sort({ appointmentDate: -1 });

        res.status(200).json({ 
            count: appointments.length,
            appointments 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── [INTERNAL API] Get patient online appointments by userId ──
export const getPatientOnlineAppointmentsInternal = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const appointments = await Appointment.find({ 
            patientId: userId,
            appointmentType: 'online'
        }).sort({ appointmentDate: -1 });

        res.status(200).json({ 
            data: appointments
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── [INTERNAL API] Get doctor online appointments by userId ──
export const getDoctorOnlineAppointmentsInternal = async (req, res) => {
    try {
        const userId = req.params.userId;

        if (!userId) {
            return res.status(400).json({ message: 'userId is required' });
        }

        const appointments = await Appointment.find({ 
            doctorId: userId,
            appointmentType: 'online'
        }).sort({ appointmentDate: -1 });

        res.status(200).json({ 
            data: appointments
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── [INTERNAL API] Get all online appointments ──
export const getAllOnlineAppointmentsInternal = async (req, res) => {
    try {
        const appointments = await Appointment.find({ 
            appointmentType: 'online'
        }).sort({ appointmentDate: -1 });

        res.status(200).json({ 
            data: appointments
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── [INTERNAL API] Update payment status (for telemedicine payment flow) ──
  export const updatePaymentStatusInternal = async (req, res) => {
   try {
       const { appointmentId } = req.params;
       const { paymentStatus } = req.body;

        if (!appointmentId || !paymentStatus) {
            return res.status(400).json({ message: 'appointmentId and paymentStatus are required' });
        }
        const appointment = await Appointment.findById(appointmentId);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        appointment.paymentStatus = paymentStatus;
        await appointment.save();

        
        // Call Telemdicine Internal API to notify about time to create session if appointment payment is completed
        if (paymentStatus === 'Completed') {
            const authBaseUrl = process.env.TELEMEDICINE_SERVICE_URL || 'http://localhost:3008';
            const endpoint = `${authBaseUrl.replace(/\/$/, '')}/internal/success/${appointmentId}`;
            console.log(`Notifying telemedicine service about payment completion for appointment ${appointmentId} at endpoint ${endpoint}`);
            const response = await axios.get(endpoint, {
                headers: {
                    'x-internal-service-key': process.env.INTERNAL_SERVICE_SECRET,
                },
                timeout: 8000,
            });

            console.log(`Notified telemedicine service about payment completion for appointment ${appointmentId}. Response:`, response.data);
        }
        res.status(200).json({ 
            data: appointment,
            message: 'Appointment status updated'
        });
   } catch (error) {
      console.error("Error in updatePaymentStatusInternal:", error);
      res.status(500).json({ message: error.message });
    }
  };
