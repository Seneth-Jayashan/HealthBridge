import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
    {
        patientId: {
            type: String,
            required: true
        },
        doctorId: {
            type: String,
            required: true
        },
        specialty: {
            type: String,
            required: true
        },
        appointmentDate: {
            type: Date,
            required: true
        },
        timeSlot: {
            type: String,
            required: true  // e.g. "09:00 AM - 09:30 AM"
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'completed', 'cancelled', 'rejected'],
            default: 'pending'
        },
        reason: {
            type: String,
            default: ''     // why patient is booking
        },
        notes: {
            type: String,
            default: ''     // doctor's notes after consultation
        }
    },
    {
        timestamps: true    // adds createdAt and updatedAt automatically
    }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;