import mongoose from 'mongoose';

const patientSchema = new mongoose.Schema({
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
    patients: [
        {
            name: { type: String, required: true },
            email: { type: String, required: true },
            phoneNumber: { type: String, required: true },
            patientId: { type: mongoose.Schema.Types.ObjectId, required: true },
            lastAppointmentDate: { type: Date },
        }
    ],
}, { timestamps: true });

export default mongoose.model('Patients', patientSchema);