import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    notificationType: [{ type: String, required: true , enum: ["SMS", "Email", "In-App", "Push"] }],

    notificationTemplate: { type: String }, // Optional field for SMS/Email templates

    title: { type: String, required: true },
    message: { type: String, required: true },

    isSent: { type: Boolean, default: false },
    isRead: { type: Boolean, default: false },

  },
  { timestamps: true }
);

export default mongoose.model('Notification', notificationSchema);