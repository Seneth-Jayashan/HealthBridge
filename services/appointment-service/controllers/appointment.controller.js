import Appointment from '../models/Appointment.js';
import { ApiError, ApiResponse } from '@healthbridge/shared';
import axios from 'axios';
import { notifyDoctorNewAppointment, notifyDoctorPaymentStatusUpdate } from '../services/appointment/notifyDoctor.service.js';
import { notifyPatientDoctorDecision } from '../services/appointment/notifyPatient.service.js';

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

// Get Doctor details for appointment service internal use (e.g. telemedicine session linking)
const getDoctorDetailsInternal = async (doctorId) => {
  return requestDoctorService(`/internal/doctor/${doctorId}`, { method: 'GET' });
};

const getPatientDetailsInternal = async (patientId) => {

  const authBaseUrl = process.env.PATIENT_SERVICE_URL || 'http://localhost:3002';
  const endpoint = `${authBaseUrl.replace(/\/$/, '')}/internal/get-patient-by-id/${patientId}`;
  const response = await axios.get(endpoint, {
    headers: {
      'x-internal-service-key': process.env.INTERNAL_SERVICE_SECRET,
    },
    timeout: 8000,
  });

  console.log(`Retrieved patient details for patientId ${patientId} from patient service. Response:`, response.data);
  return response.data;
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

    const doctorDetails = await getDoctorDetailsInternal(doctorId).catch(() => null);
    if (!doctorDetails) {
      console.warn(`[Appointment Service] Warning: Could not retrieve details for doctor ${doctorId}. Doctor notifications will be skipped.`);
      return res.status(201).json(new ApiResponse(201, appt, 'Appointment created (Pending)'));
    }

    // Notify the doctor about the new appointment
    await notifyDoctorNewAppointment({
      patientUserId: req.user.id,
      doctorUserId: doctorDetails.data.userId,
      appointmentId: appt._id,
      appointmentDate: appt.startTime,
      appointmentTime: appt.endTime,
    });


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

// PATCH /appointments/:id (Patient) - edit pending appointment details only
export const updateAppointmentByPatient = async (req, res, next) => {
  try {
    if (!assertRole(req, 'Patient')) throw new ApiError(403, 'Only Patients can edit appointments');

    const { id } = req.params;
    const appt = await Appointment.findById(id);
    if (!appt) throw new ApiError(404, 'Appointment not found');
    if (String(appt.patientId) !== String(req.user.id)) throw new ApiError(403, 'Not allowed');

    if (appt.status !== 'Pending') {
      throw new ApiError(409, `Cannot edit appointment in status: ${appt.status}`);
    }

    const {
      reason,
      notes,
      patientPhone,
      dayOfWeek,
      timeSlotId,
      startTime,
      endTime,
    } = req.body || {};

    const requestedDayOfWeek = typeof dayOfWeek !== 'undefined' ? String(dayOfWeek).trim() : appt.dayOfWeek;
    const requestedTimeSlotId = typeof timeSlotId !== 'undefined' ? String(timeSlotId).trim() : String(appt.timeSlotId);
    const requestedStartTime = typeof startTime !== 'undefined' ? String(startTime).trim() : appt.startTime;
    const requestedEndTime = typeof endTime !== 'undefined' ? String(endTime).trim() : appt.endTime;

    const scheduleChanged =
      requestedDayOfWeek !== appt.dayOfWeek ||
      requestedTimeSlotId !== String(appt.timeSlotId) ||
      requestedStartTime !== appt.startTime ||
      requestedEndTime !== appt.endTime;

    if (scheduleChanged) {
      if (!requestedDayOfWeek || !requestedTimeSlotId || !requestedStartTime || !requestedEndTime) {
        throw new ApiError(400, 'dayOfWeek, timeSlotId, startTime, endTime are required for rescheduling');
      }

      // Reserve target slot first to prevent losing the current booking on conflicts.
      await reserveSlotInternal({
        doctorId: appt.doctorId,
        dayOfWeek: requestedDayOfWeek,
        timeSlotId: requestedTimeSlotId,
        patientId: appt.patientId,
        patientName: req.user?.name || appt.patientName,
        appointmentId: appt._id,
      });
    }

    // Only allow patient-editable, non-scheduling fields.
    if (typeof reason !== 'undefined') appt.reason = String(reason || '').trim();
    if (typeof notes !== 'undefined') appt.notes = String(notes || '').trim();
    if (typeof patientPhone !== 'undefined') appt.patientPhone = String(patientPhone || '').trim();

    if (scheduleChanged) {
      const previousDayOfWeek = appt.dayOfWeek;
      const previousTimeSlotId = appt.timeSlotId;

      appt.dayOfWeek = requestedDayOfWeek;
      appt.timeSlotId = requestedTimeSlotId;
      appt.startTime = requestedStartTime;
      appt.endTime = requestedEndTime;

      try {
        await appt.save();
      } catch (dbErr) {
        // Roll back newly reserved slot if save fails.
        await releaseSlotInternal({
          doctorId: appt.doctorId,
          dayOfWeek: requestedDayOfWeek,
          timeSlotId: requestedTimeSlotId,
          appointmentId: appt._id,
        }).catch(() => {});
        throw dbErr;
      }

      // Release old slot after successful save.
      await releaseSlotInternal({
        doctorId: appt.doctorId,
        dayOfWeek: previousDayOfWeek,
        timeSlotId: previousTimeSlotId,
        appointmentId: appt._id,
      }).catch(() => {});

      return res.status(200).json(new ApiResponse(200, appt, 'Appointment updated'));
    }

    await appt.save();
    res.status(200).json(new ApiResponse(200, appt, 'Appointment updated'));
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

    // Notify the patient about the doctor's decision
    await notifyPatientDoctorDecision({
      doctorUserId: doctorId,
      patientUserId: appt.patientId,
      appointmentId: appt._id,
      appointmentDate: appt.startTime,
      appointmentTime: appt.endTime,
      decision: appt.status,
      note: appt.doctorDecisionNote
    });

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
        appointment.status = paymentStatus;
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

        const doctorDetails = await getDoctorDetailsInternal(appointment.doctorId).catch(() => null);
        if (!doctorDetails) {
          console.warn(`[Appointment Service] Warning: Could not retrieve details for doctor ${appointment.doctorId}. Doctor notifications will be skipped.`);
          res.status(404).json({ message: 'Doctor details not found, payment status updated but doctor notification skipped' });
          return;
        }

        await notifyDoctorPaymentStatusUpdate({
          patientUserId: appointment.patientId,
          doctorUserId: doctorDetails.data.userId,
          appointmentId: appointment._id,
          appointmentDate: appointment.startTime,
          appointmentTime: appointment.endTime,
          paymentStatus,
        });
        res.status(200).json({ 
            data: appointment,
            message: 'Appointment status updated'
        });
   } catch (error) {
      console.error("Error in updatePaymentStatusInternal:", error);
      res.status(500).json({ message: error.message });
    }
  };
