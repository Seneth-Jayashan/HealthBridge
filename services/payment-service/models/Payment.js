import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Auto Generated Unique Order ID for Each Payment
    orderId: {
      type: String,
      unique: true, 
    },

    amount: { 
        type: Number,
        required: true,
        min: 0
    },

    // -- Payhere Specific Fields --
    payhere_order_id: {
        type: String,
        index: true
    },
    payhere_payment_id: { 
        type: String, 
        index: true 
    },
    payhere_currency: { 
        type: String,
        enum: ["LKR", "USD", "EUR"],
        default: "LKR"
    },
    payhere_status_code: { 
        type: Number 
    },
    payhere_md5sig: { 
        type: String 
    },

    paymentDate: { 
        type: Date, 
        required: true, 
        default: Date.now 
    },

    // Payhere Returned Transaction ID
    transactionId: { 
        type: String, 
        unique: true,
        sparse: true 
    },
    status: {
      type: String,
      enum: ["completed", "pending", "failed"],
      default: "pending", 
    },
    notes: { 
        type: String 
    }
  },
  { timestamps: true }
);


PaymentSchema.pre("validate", async function () {
  if (this.isNew && !this.orderId) {
    try {
      const lastPayment = await this.constructor.findOne({}, 'orderId').sort({ createdAt: -1 }).exec();
      
      let nextIdNumber = 1;

      if (lastPayment && lastPayment.orderId) {
        const parts = lastPayment.orderId.split("-");
        if (parts.length === 2) {
          const lastId = parseInt(parts[1], 10);
          if (!isNaN(lastId)) {
            nextIdNumber = lastId + 1;
          }
        }
      }

      this.orderId = `ORD-${nextIdNumber.toString().padStart(4, '0')}`;
    } catch (error) {
      throw error; 
    }
  }
});

export default mongoose.model("Payment", PaymentSchema);