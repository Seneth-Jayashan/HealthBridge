import mongoose from 'mongoose';

const availabilitySchema = new mongoose.Schema({
    day: { 
        type: String, 
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        required: true
    },
    startTime: { type: String, required: true }, // Format: "09:00"
    endTime: { type: String, required: true }    // Format: "17:00"
}, { _id: false }); // Prevents MongoDB from creating a separate ID for each time slot

const doctorSchema = new mongoose.Schema(
    {
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: true, 
            unique: true,
            ref: 'User'
        },
        specialization: { type: String },
        qualifications: [{ type: String }],
        experienceYears: { type: Number, default: 0 },
        bio: { type: String },
        consultationFee: { type: Number, default: 0 },
        isVerified: { type: Boolean, default: false }, // Admins will toggle this later
        availability: [availabilitySchema]
    },
    { timestamps: true }
);

export default mongoose.model('Doctor', doctorSchema);