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
        appointmentType: {
            type: String,
            enum: ['online', 'physical'],
            required: true,
            default: 'physical'
        },
        appointmentDate: {
            type: Date,
            required: true
        },
        timeSlot: {
            type: String,
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'completed','cancelled', 'rejected'],
            default: 'pending'
        },
        reason: {
            type: String,
            default: ''
        },
        notes: {
            type: String,
            default: ''
        }
    },
    {
        timestamps: true
    }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);
export default Appointment;