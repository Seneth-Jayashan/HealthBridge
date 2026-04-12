import Appointment from '../models/Appointment.js';

// ─── Book an appointment ───────────────────────────────
export const bookAppointment = async (req, res) => {
    try {
        const { doctorId, specialty, appointmentDate, timeSlot, reason } = req.body;
        const patientId = req.user.id; // comes from JWT token

        // Check if that time slot is already booked
        const existing = await Appointment.findOne({
            doctorId,
            appointmentDate,
            timeSlot,
            status: { $nin: ['cancelled', 'rejected'] }
        });

        if (existing) {
            return res.status(400).json({ message: 'This time slot is already booked' });
        }

        const appointment = await Appointment.create({
            patientId,
            doctorId,
            specialty,
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

        // Find all appointments for that specialty to see which doctors are available
        const appointments = await Appointment.find({
            specialty: { $regex: specialty, $options: 'i' } // case-insensitive search
        }).distinct('doctorId');

        res.status(200).json({
            message: `Doctors found for specialty: ${specialty}`,
            doctorIds: appointments
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Get all appointments for logged-in patient ───────
export const getMyAppointments = async (req, res) => {
    try {
        const patientId = req.user.id;

        const appointments = await Appointment.find({ patientId })
            .sort({ appointmentDate: -1 }); // newest first

        res.status(200).json({ appointments });

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
            appointmentDate: appointment.appointmentDate,
            timeSlot: appointment.timeSlot
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Modify an appointment ────────────────────────────
export const modifyAppointment = async (req, res) => {
    try {
        const { id } = req.params;
        const { appointmentDate, timeSlot, reason } = req.body;
        const patientId = req.user.id;

        const appointment = await Appointment.findOne({ _id: id, patientId });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Only pending appointments can be modified
        if (appointment.status !== 'pending') {
            return res.status(400).json({ message: `Cannot modify a ${appointment.status} appointment` });
        }

        appointment.appointmentDate = appointmentDate || appointment.appointmentDate;
        appointment.timeSlot = timeSlot || appointment.timeSlot;
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
            return res.status(400).json({ message: 'Cannot cancel a completed appointment' });
        }

        appointment.status = 'cancelled';
        await appointment.save();

        res.status(200).json({ message: 'Appointment cancelled successfully' });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ─── Doctor: update appointment status ───────────────
export const updateAppointmentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        const doctorId = req.user.id;

        const validStatuses = ['confirmed', 'completed', 'rejected'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ message: 'Invalid status' });
        }

        const appointment = await Appointment.findOne({ _id: id, doctorId });

        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        appointment.status = status;
        await appointment.save();

        res.status(200).json({
            message: `Appointment ${status} successfully`,
            appointment
        });

    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};