import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
    {
        // This links the profile to the central Auth ID
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: true, 
            unique: true,
            ref: 'User' // Reference to the Auth service's User model
        },
        dateOfBirth: { type: Date },
        gender: { 
            type: String, 
            enum: ['Male', 'Female', 'Other', 'Prefer not to say'] 
        },
        contactNumber: { type: String },
        address: { type: String },
        emergencyContact: {
            name: { type: String },
            relationship: { type: String },
            phoneNumber: { type: String }
        }
    },
    { timestamps: true }
);

export default mongoose.model('Patient', patientSchema);