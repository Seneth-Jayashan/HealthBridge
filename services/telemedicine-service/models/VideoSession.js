import mongoose from 'mongoose';

const videoSessionSchema = new mongoose.Schema(
    {
        appointmentId: {
            type: String,
            index: true
        },
        channelName: {
            type: String,
            required: true,
            unique: true,
            trim: true
        },
        doctorId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
            index: true
        },
        patientId: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User',
            index: true
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['scheduled', 'active', 'completed', 'cancelled'],
            default: 'scheduled',
            index: true
        },
        scheduledAt: {
            type: Date
        },
        startedAt: {
            type: Date
        },
        endedAt: {
            type: Date
        },
        agora: {
            tokenTTLSeconds: {
                type: Number,
                default: 3600
            },
            lastIssuedAt: {
                type: Date
            }
        },
        metadata: {
            reason: { type: String },
            notes: { type: String }
        }
    },
    { timestamps: true }
);

videoSessionSchema.index({ doctorId: 1, patientId: 1, createdAt: -1 });

export default mongoose.model('VideoSession', videoSessionSchema);