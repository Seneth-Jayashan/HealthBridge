import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema(
    {
        // --- 1. CORE AUTH & REGISTER ---
        userId: { 
            type: mongoose.Schema.Types.ObjectId, 
            required: true, 
            unique: true,
            ref: 'User' 
        },

        patientId: { 
            type: String, 
            unique: true,
        },

        isUpdated: { 
            type: Boolean, 
            default: false 
        },

        // --- 2. MANAGE PROFILE ---
        dateOfBirth: { type: Date },
        gender: { 
            type: String, 
            enum: ['Male', 'Female', 'Other', 'Prefer not to say'] 
        },
        bloodGroup: {
            type: String,
            enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
        },
        address: { type: String },
        emergencyContact: {
            name: { type: String },
            relationship: { type: String },
            phoneNumber: { type: String }
        },
        // Medical Background
        allergies: [{ type: String }],
        chronicConditions: [{ type: String }],

        // --- 3. UPLOAD REPORTS ---
        medicalReports: [
            {
                title: { type: String, required: true },
                fileUrl: { type: String, required: true },
                publicId: { type: String, required: true },
                reportType: { type: String, enum: ['Lab Result', 'Scan', 'General', 'Other'] },
                uploadedAt: { type: Date, default: Date.now },
                notes: { type: String }
            }
        ],
    },
    { timestamps: true }
);

patientSchema.pre('save', async function (next) {
    if (!this.patientId) {
        try {
            const lastPatient = await this.constructor.findOne({}, { patientId: 1 })
                                        .sort({ patientId: -1 })
                                        .exec();

            if (lastPatient && lastPatient.patientId) {
                const lastIdString = lastPatient.patientId.replace('PID-', '');
                const lastIdNumber = parseInt(lastIdString, 10);
                
                const nextIdNumber = lastIdNumber + 1;
                
                this.patientId = `PID-${String(nextIdNumber).padStart(5, '0')}`;
            } else {
                this.patientId = 'PID-00001';
            }
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

export default mongoose.model('Patient', patientSchema);