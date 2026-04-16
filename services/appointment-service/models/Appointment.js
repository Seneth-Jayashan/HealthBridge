import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
  {
    doctorId: { type: mongoose.Schema.Types.ObjectId, required: true },
    patientId: { type: mongoose.Schema.Types.ObjectId, required: true },

    dayOfWeek: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true,
    },
    timeSlotId: { type: mongoose.Schema.Types.ObjectId, required: true }, // Availability.timeSlots._id
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },

    status: {
      type: String,
      enum: ['Pending', 'Accepted', 'Rejected', 'Cancelled', 'Completed'],
      default: 'Pending',
      index: true,
    },

    // Patient-provided info (keep flexible)
    patientName: { type: String },
    patientPhone: { type: String },
    reason: { type: String },
    notes: { type: String },

    // Doctor decision metadata
    doctorDecisionNote: { type: String },
    decidedAt: { type: Date },
    cancelledAt: { type: Date },
    completedAt: { type: Date },

    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed'],
      default: 'Pending',
    },
    paymentId: { type: mongoose.Schema.Types.ObjectId }, 
  },
  { timestamps: true }
);

appointmentSchema.index({ doctorId: 1, dayOfWeek: 1, timeSlotId: 1 });
appointmentSchema.index({ patientId: 1, createdAt: -1 });
appointmentSchema.index({ doctorId: 1, createdAt: -1 });

export default mongoose.model('Appointment', appointmentSchema);
