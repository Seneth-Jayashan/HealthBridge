import mongoose from 'mongoose';

const PrescriptionSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Patient',
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    prescriptionId: {
        type: String,
        unique: true,
    },
    medication: [
        {
            medicineName: {
                type: String,
                required: true
            },
            dosage: {
                type: String,
                required: true
            },
            frequency: {
                type: String,
                required: true
            },
            duration: {
                type: String,
                required: true
            }
        }
    ],
    notes: {
        type: String,
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    }
}, { timestamps: true });

PrescriptionSchema.pre('save', async function (next) {
    if (!this.prescriptionId) {
        try {
           
            const lastPrescription = await this.constructor.findOne().sort({ prescriptionId: -1 });
            
            if (lastPrescription && lastPrescription.prescriptionId) {
                const lastIdNum = parseInt(lastPrescription.prescriptionId.replace('PRESC - ', ''), 10);
                this.prescriptionId = 'PRESC - ' + (lastIdNum + 1).toString().padStart(6, '0');
            } else {
                this.prescriptionId = 'PRESC - 000001';
            }
            next();
        } catch (error) {
            next(error);
        }
    } else {
        next();
    }
});

export default mongoose.model('Prescription', PrescriptionSchema);