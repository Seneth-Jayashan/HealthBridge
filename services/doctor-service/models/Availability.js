import mongoose from "mongoose";

const availabilitySchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    dayOfWeek: { 
        type: String, 
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
     },
    timeSlots: [{
        startTime: { type: String, required: true },
        endTime: { type: String, required: true },
        isBooked: { type: Boolean, default: false },
        bookingDetails: {
            patientId: { type: mongoose.Schema.Types.ObjectId, },
            patientName: { type: String },
            appointmentId: { type: mongoose.Schema.Types.ObjectId },
            bookedAt: { type: Date }
        }
    }],
}, {timestamps: true});

export default mongoose.model('Availability', availabilitySchema);