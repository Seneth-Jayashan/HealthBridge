import Appointment from '../models/Appointment.js';

// ─── Book an appointment ───────────────────────────────
export const bookAppointment = async (req, res) => {
    try {
        const { 
            doctorId, 
            specialty, 
            appointmentType, 
            appointmentDate, 
            timeSlot, 
            reason 
        } = req.body;

        const patientId = req.user.id;

        // Validate required fields
        if (!doctorId || !specialty || !appointmentType || !appointmentDate || !timeSlot) {
            return res.status(400).json({ message: 'All fields are required' });
        }

        // Validate appointmentType
        if (!['online', 'physical'].includes(appointmentType)) {
            return res.status(400).json({ 
                message: 'appointmentType must be online or physical' 
            });
        }

        // Check if that time slot is already booked
        const existing = await Appointment.findOne({
            doctorId,
            appointmentDate,
            timeSlot,
            status: { $nin: ['cancelled', 'rejected'] }
        });

        if (existing) {
            return res.status(400).json({ 
                message: 'This time slot is already booked' 
            });
        }

        const appointment = await Appointment.create({
            patientId,
            doctorId,
            specialty,
            appointmentType,
            appointmentDate,
            timeSlot,
            reason
        });

        res.status(201).json({
            message: 'Appointment booked successfully',
            appointment
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Search doctors by specialty ──────────────────────
export const searchBySpecialty = async (req, res) => {
    try {
        const { specialty } = req.query;

        if (!specialty) {
            return res.status(400).json({ message: 'Specialty is required' });
        }

        const doctorIds = await Appointment.find({
            specialty: { $regex: specialty, $options: 'i' },
            status: { $nin: ['cancelled', 'rejected'] }
        }).distinct('doctorId');

        res.status(200).json({
            message: `Doctors found for specialty: ${specialty}`,
            doctorIds
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get all appointments for logged in patient ───────
export const getMyAppointments = async (req, res) => {
    try {
        const patientId = req.user.id;

        const appointments = await Appointment.find({ patientId })
            .sort({ appointmentDate: -1 });

        res.status(200).json({ 
            count: appointments.length,
            appointments 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get single appointment status ────────────────────
export const getAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        res.status(200).json({
            appointmentId: appointment._id,
            status: appointment.status,
            appointmentType: appointment.appointmentType,
            specialty: appointment.specialty,
            appointmentDate: appointment.appointmentDate,
            timeSlot: appointment.timeSlot
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get all appointments for a doctor ────────────────
export const getDoctorAppointments = async (req, res) => {
    try {
        const doctorId = req.user.id;

        const appointments = await Appointment.find({ doctorId })
            .sort({ appointmentDate: -1 });

        res.status(200).json({ 
            count: appointments.length,
            appointments 
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Modify an appointment ────────────────────────────
export const modifyAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { appointmentDate, timeSlot, appointmentType, reason } = req.body;
        const patientId = req.user.id;

        const appointment = await Appointment.findOne({ _id: id, patientId });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Only pending appointments can be modified
        if (appointment.status !== 'pending') {
            return res.status(400).json({ 
                message: `Cannot modify a ${appointment.status} appointment` 
            });
        }

        // Validate appointmentType if provided
        if (appointmentType && !['online', 'physical'].includes(appointmentType)) {
            return res.status(400).json({ 
                message: 'appointmentType must be online or physical' 
            });
        }

        appointment.appointmentDate = appointmentDate || appointment.appointmentDate;
        appointment.timeSlot = timeSlot || appointment.timeSlot;
        appointment.appointmentType = appointmentType || appointment.appointmentType;
        appointment.reason = reason || appointment.reason;

        await appointment.save();

        res.status(200).json({
            message: 'Appointment updated successfully',
            appointment
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Cancel an appointment ────────────────────────────
export const cancelAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const patientId = req.user.id;

        const appointment = await Appointment.findOne({ _id: id, patientId });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        if (appointment.status === 'completed') {
            return res.status(400).json({ 
                message: 'Cannot cancel a completed appointment' 
            });
        }

        if (appointment.status === 'cancelled') {
            return res.status(400).json({ 
                message: 'Appointment is already cancelled' 
            });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        res.status(200).json({ 
            message: 'Appointment cancelled successfully',
            appointment
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Doctor: update appointment status ───────────────
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status, notes } = req.body;
        const doctorId = req.user.id;

        const validStatuses = ['confirmed', 'completed', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                message: 'Status must be confirmed, completed or rejected' 
            });
        }

        const appointment = await Appointment.findOne({ _id: id, doctorId });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appointment.status = status;
        if (notes) appointment.notes = notes;

        await appointment.save();

        res.status(200).json({
            message: `Appointment ${status} successfully`,
            appointment
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get online appointments for patient (Telemedicine) ──
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