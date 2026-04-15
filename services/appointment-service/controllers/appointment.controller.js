import mongoose from 'mongoose';
import Appointment from '../models/Appointment.js';
import Availability from '../models/Availability.js';
import Doctor from '../models/DoctorService.js';
import { ApiError, ApiResponse } from '@healthbridge/shared';

const VALID_STATUSES = ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'];

const getDayOfWeek = (date) =>
  new Date(date).toLocaleDateString('en-US', { weekday: 'long' });

const parseTimeSlot = (timeSlot = '') => {
  const [startTime, endTime] = timeSlot.split('-').map((s) => s?.trim());
  if (!startTime || !endTime) return null;
  return { startTime, endTime };
};

// @desc    Book appointment (Patient)
// @route   POST /api/appointments/book
// @access  Private (Patient)
export const bookAppointment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const patientId = req.user.id;
    const patientName = req.user?.name || '';

    const {
      doctorId,
      appointmentDate,
      timeSlot,
      reason = '',
      notes = ''
    } = req.body;

    if (!doctorId || !appointmentDate || !timeSlot) {
      throw new ApiError(400, 'doctorId, appointmentDate and timeSlot are required');
    }

    const slotParts = parseTimeSlot(timeSlot);
    if (!slotParts) {
      throw new ApiError(400, 'Invalid timeSlot format. Expected "HH:mm-HH:mm"');
    }

    const doctor = await Doctor.findById(doctorId).session(session);
    if (!doctor || doctor.verificationStatus !== 'Approved') {
      throw new ApiError(404, 'Doctor not found or not available for appointments');
    }

    const dateObj = new Date(appointmentDate);
    if (Number.isNaN(dateObj.getTime())) {
      throw new ApiError(400, 'Invalid appointmentDate');
    }

    const dayOfWeek = getDayOfWeek(dateObj);

    // Lock slot atomically if free
    const updatedAvailability = await Availability.findOneAndUpdate(
      {
        doctorId: doctor._id,
        dayOfWeek,
        timeSlots: {
          $elemMatch: {
            startTime: slotParts.startTime,
            endTime: slotParts.endTime,
            isBooked: false
          }
        }
      },
      {
        $set: {
          'timeSlots.$.isBooked': true,
          'timeSlots.$.bookingDetails': {
            patientId,
            patientName,
            bookedAt: new Date()
          }
        }
      },
      { new: true, session }
    );

    if (!updatedAvailability) {
      throw new ApiError(409, 'Selected time slot is not available');
    }

    // Prevent duplicate appointments for same doctor/date/slot
    const existing = await Appointment.findOne({
      doctorId: doctor._id,
      appointmentDate: dateObj,
      timeSlot,
      status: { $in: ['pending', 'confirmed'] }
    }).session(session);

    if (existing) {
      throw new ApiError(409, 'This slot is already booked');
    }

    const [appointment] = await Appointment.create(
      [
        {
          patientId,
          doctorId: doctor._id,
          specialty: doctor.specialization,
          appointmentType: 'online', // forced online-only
          appointmentDate: dateObj,
          dayOfWeek,
          timeSlot,
          reason,
          notes,
          status: 'pending'
        }
      ],
      { session }
    );

    // attach appointmentId into slot bookingDetails
    await Availability.updateOne(
      {
        doctorId: doctor._id,
        dayOfWeek,
        'timeSlots.startTime': slotParts.startTime,
        'timeSlots.endTime': slotParts.endTime
      },
      {
        $set: {
          'timeSlots.$.bookingDetails.appointmentId': appointment._id
        }
      },
      { session }
    );

    await session.commitTransaction();

    return res
      .status(201)
      .json(new ApiResponse(201, appointment, 'Appointment booked successfully'));
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Search doctors by specialty (Patient helper)
// @route   GET /api/appointments/search?specialty=Cardiology
// @access  Private
export const searchBySpecialty = async (req, res, next) => {
  try {
    const { specialty, page = 1, limit = 10 } = req.query;

    const query = { verificationStatus: 'Approved' };
    if (specialty) query.specialization = { $regex: specialty, $options: 'i' };

    const doctors = await Doctor.find(query)
      .select('specialization consultationFee averageRating totalReviews')
      .skip((Number(page) - 1) * Number(limit))
      .limit(Number(limit))
      .sort({ averageRating: -1, createdAt: -1 })
      .lean();

    const total = await Doctor.countDocuments(query);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          doctors,
          pagination: {
            totalPages: Math.ceil(total / Number(limit)),
            currentPage: Number(page),
            totalRecords: total
          }
        },
        'Doctors retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get my appointments (Patient)
// @route   GET /api/appointments/my
// @access  Private (Patient)
export const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id })
      .sort({ appointmentDate: 1, createdAt: -1 });

    return res
      .status(200)
      .json(new ApiResponse(200, appointments, 'My appointments retrieved successfully'));
  } catch (error) {
    next(error);
  }
};

// @desc    Get appointment status by ID
// @route   GET /api/appointments/:id/status
// @access  Private (Owner patient / owner doctor)
export const getAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) throw new ApiError(404, 'Appointment not found');

    // Optional basic access guard (if your auth middleware has role)
    // patient can access own appointment
    // doctor can access appointments tied to their profile
    const isPatientOwner = appointment.patientId.toString() === req.user.id.toString();

    let isDoctorOwner = false;
    const doctorProfile = await Doctor.findOne({ userId: req.user.id }).select('_id').lean();
    if (doctorProfile) {
      isDoctorOwner = appointment.doctorId.toString() === doctorProfile._id.toString();
    }

    if (!isPatientOwner && !isDoctorOwner) {
      throw new ApiError(403, 'Unauthorized to view this appointment');
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          appointmentId: appointment._id,
          status: appointment.status
        },
        'Appointment status retrieved successfully'
      )
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Get doctor appointments
// @route   GET /api/appointments/doctor/my
// @access  Private (Doctor)
export const getDoctorAppointments = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user.id }).select('_id');
    if (!doctor) throw new ApiError(404, 'Doctor profile not found');

    const appointments = await Appointment.find({ doctorId: doctor._id }).sort({
      appointmentDate: 1,
      createdAt: -1
    });

    return res.status(200).json(
      new ApiResponse(200, appointments, 'Doctor appointments retrieved successfully')
    );
  } catch (error) {
    next(error);
  }
};

// @desc    Modify appointment details (Patient)
// @route   PUT /api/appointments/:id
// @access  Private (Patient)
export const modifyAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { reason, notes } = req.body;

    const appointment = await Appointment.findOne({ _id: id, patientId: req.user.id });
    if (!appointment) throw new ApiError(404, 'Appointment not found');

    if (appointment.status !== 'pending') {
      throw new ApiError(400, 'Only pending appointments can be modified');
    }

    if (typeof reason !== 'undefined') appointment.reason = reason;
    if (typeof notes !== 'undefined') appointment.notes = notes;

    await appointment.save();

    return res
      .status(200)
      .json(new ApiResponse(200, appointment, 'Appointment updated successfully'));
  } catch (error) {
    next(error);
  }
};

// @desc    Cancel appointment (Patient)
// @route   DELETE /api/appointments/:id
// @access  Private (Patient)
export const cancelAppointment = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const patientId = req.user.id;

    const appointment = await Appointment.findOne({ _id: id, patientId }).session(session);
    if (!appointment) throw new ApiError(404, 'Appointment not found');

    // patient can cancel only before doctor confirmation
    if (appointment.status !== 'pending') {
      throw new ApiError(400, 'You can only cancel before doctor confirmation');
    }

    appointment.status = 'cancelled';
    await appointment.save({ session });

    const slotParts = parseTimeSlot(appointment.timeSlot);
    if (!slotParts) throw new ApiError(400, 'Invalid appointment slot format');

    await Availability.updateOne(
      {
        doctorId: appointment.doctorId,
        dayOfWeek: appointment.dayOfWeek,
        'timeSlots.startTime': slotParts.startTime,
        'timeSlots.endTime': slotParts.endTime
      },
      {
        $set: {
          'timeSlots.$.isBooked': false,
          'timeSlots.$.bookingDetails': {}
        }
      },
      { session }
    );

    await session.commitTransaction();

    return res
      .status(200)
      .json(new ApiResponse(200, appointment, 'Appointment cancelled and slot reopened'));
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};

// @desc    Update appointment status by doctor (confirm/reject/complete)
// @route   PATCH /api/appointments/:id/status
// @access  Private (Doctor)
export const updateAppointmentStatus = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!VALID_STATUSES.includes(status)) {
      throw new ApiError(400, `Invalid status. Allowed: ${VALID_STATUSES.join(', ')}`);
    }

    const doctor = await Doctor.findOne({ userId: req.user.id }).session(session);
    if (!doctor) throw new ApiError(404, 'Doctor profile not found');

    const appointment = await Appointment.findOne({
      _id: id,
      doctorId: doctor._id
    }).session(session);

    if (!appointment) throw new ApiError(404, 'Appointment not found');

    // Allowed transitions:
    // pending -> confirmed/rejected
    // confirmed -> completed
    // (cancelled/rejected/completed are terminal for doctor updates)
    const current = appointment.status;
    const validTransition =
      (current === 'pending' && ['confirmed', 'rejected'].includes(status)) ||
      (current === 'confirmed' && status === 'completed');

    if (!validTransition) {
      throw new ApiError(400, `Invalid status transition: ${current} -> ${status}`);
    }

    appointment.status = status;
    await appointment.save({ session });

    // If rejected, reopen slot
    if (status === 'rejected') {
      const slotParts = parseTimeSlot(appointment.timeSlot);
      if (!slotParts) throw new ApiError(400, 'Invalid appointment slot format');

      await Availability.updateOne(
        {
          doctorId: appointment.doctorId,
          dayOfWeek: appointment.dayOfWeek,
          'timeSlots.startTime': slotParts.startTime,
          'timeSlots.endTime': slotParts.endTime
        },
        {
          $set: {
            'timeSlots.$.isBooked': false,
            'timeSlots.$.bookingDetails': {}
          }
        },
        { session }
      );
    }

    await session.commitTransaction();

    return res
      .status(200)
      .json(new ApiResponse(200, appointment, `Appointment ${status} successfully`));
  } catch (error) {
    await session.abortTransaction();
    next(error);
  } finally {
    session.endSession();
  }
};