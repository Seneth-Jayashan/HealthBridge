import mongoose from 'mongoose';


const doctorSchema = new mongoose.Schema(
    {
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: true, 
            unique: true,
            ref: 'User' // Links to the base User model (handling login/passwords)
        },
        doctorID: { type: String, unique: true, sparse: true },
        specialization: { type: String, required: true },
        
        registrationNumber: { type: String, required: true, unique: true }, 
        
        qualifications: [{ type: String }],
        experienceYears: { type: Number, default: 0 },
        bio: { type: String },
        consultationFee: { type: Number, default: 0 },
        
        verificationStatus: { 
            type: String, 
            enum: ['Pending', 'Review', 'Approved', 'Rejected'], 
            default: 'Pending' 
        }, 
        
        // NEW: URLs to medical licenses/IDs uploaded for Admin review
        verificationDocuments: {
            documentType: { type: String }, // e.g., "Medical License"
            documentURL: { type: String }   //URL from Cloudinary
        }, 
        
        isAvailabilitySet: { type: Boolean, default: false },

        // NEW: Helpful for the Patient's "search for doctors" feature
        rating: [{
            patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            rating: { type: Number, min: 1, max: 5, required: true },
            comment: { type: String }
        }],
        averageRating: { type: Number, min: 0, max: 5, default: 0 },
        totalReviews: { type: Number, default: 0 }
    },
    { timestamps: true }
);

export default mongoose.model('Doctor', doctorSchema);