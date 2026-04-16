import Payment from "../models/Payment.js"; // Ensure you include .js for ES Modules
import crypto from "crypto";
import axios from "axios";

// -- HELPERS --
const MERCHANT_ID = process.env.PAYHERE_MERCHANT_ID || "your_merchant_id"; 
const MERCHANT_SECRET = process.env.PAYHERE_SECRET || "your_merchant_secret"; 

// Fix: Corrected the MD5 Signature Generator for the Webhook
const computePayHereMd5sig = ({ merchant_id, order_id, payhere_amount, payhere_currency, status_code, merchant_secret }) => {
    const hashedSecret = crypto.createHash('md5').update(merchant_secret).digest('hex').toUpperCase();
    const dataString = `${merchant_id}${order_id}${payhere_amount}${payhere_currency}${status_code}${hashedSecret}`;
    return crypto.createHash("md5").update(dataString).digest("hex").toUpperCase();
};

// Format Amount to Payhere's Required Format (2 Decimal Places, No Commas)
const formatPayHereAmount = (amount) => {
    return parseFloat(amount)
        .toLocaleString('en-us', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
        .replace(/,/g, '');
};

const checkConsultingFee = async (doctorId) => {
    try {
        const authBaseUrl = process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003';
        const endpoint = `${authBaseUrl.replace(/\/$/, '')}/internal/payment/checkFee?doctorId=${doctorId}`;

        const response = await axios.get(endpoint, {
            headers: {
                'x-internal-service-key': process.env.INTERNAL_SERVICE_SECRET,
            },
            timeout: 8000,
        });

        return response.data?.data || null;
    } catch (error) {
        console.error('Error checking consultation fee:', error.message);
        return null;
    }
};

// -- CONTROLLERS --

// Create a New Payment Record
export const createPayment = async (req, res) => {
  try {
    const { patientId, doctorId, appointmentId, currency = "LKR" } = req.body;
    
    if (!patientId || !doctorId || !appointmentId) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // check appointment is already exists or not
    const existingPayment = await Payment.findOne({ appointmentId });
    if (existingPayment) {
        return res.status(400).json({ message: "Payment Data for this appointment already exists" });
    }

    const isAmountValid = await checkConsultingFee(doctorId);
    if(isAmountValid.consultationFee === undefined || isAmountValid.consultationFee === null) {
        return res.status(400).json({ message: "Unable to verify consultation fee. Please try again later." });
    }
    const amount = isAmountValid.consultationFee;

    if (!MERCHANT_ID || !MERCHANT_SECRET) {
        return res.status(500).json({ message: "Payment gateway configuration is missing" });
    }

    const amountForPayHere = formatPayHereAmount(amount);
    
    // Create payment in "pending" status
    const newPayment = new Payment({
        patientId,
        doctorId,
        appointmentId,
        amount: Number(amount), // Save as Number in DB
        payhere_currency: currency // Match the schema field name
    });
    
    await newPayment.save();

    // Generate Hash for Checkout Form
    const hashedSecret = crypto.createHash('md5')
            .update(MERCHANT_SECRET)
            .digest('hex')
            .toUpperCase();

    const mainString = MERCHANT_ID + newPayment.orderId + amountForPayHere + currency + hashedSecret;
        
    const hash = crypto.createHash('md5')
            .update(mainString)
            .digest('hex')
            .toUpperCase();

    res.json({
        merchant_id: MERCHANT_ID,
        hash: hash,
        amount: amountForPayHere,
        order_id: newPayment.orderId, // This is what Payhere will send back
        currency: currency
    });
  } catch (err) {
    console.error("Error creating payment:", err);
    res.status(500).json({ message: "Server error" ,error: err.message});   
  }
};


// PayHere Webhook - Corrected for Doctor/Patient Context
export const payHereWebhook = async (req, res) => {
  try {
    const {
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      md5sig,
      payment_id
    } = req.body;

    if (!merchant_id || !md5sig) {
      return res.status(400).send("Invalid Payload");
    }

    // 1. Verify Signature
    const computedSig = computePayHereMd5sig({
      merchant_id,
      order_id,
      payhere_amount,
      payhere_currency,
      status_code,
      merchant_secret: MERCHANT_SECRET,
    });

    if (computedSig !== md5sig.toUpperCase()) {
      console.error(`PayHere Signature Mismatch! Order: ${order_id}`);
      return res.status(400).send("Signature verification failed");
    }

    // 2. Find the existing pending payment
    // We search by orderId because that is what we sent to Payhere in createPayment
    let payment = await Payment.findOne({ orderId: order_id });

    if (!payment) {
      console.error(`Webhook received for unknown order_id: ${order_id}`);
      // Do NOT create a new payment here. If it doesn't exist, it's an orphaned/invalid transaction.
      return res.status(404).send("Payment record not found");
    }

    // 3. Determine Status
    const isSuccess = Number(status_code) === 2;
    const paymentStatus = isSuccess ? "completed" : Number(status_code) === 0 ? "pending" : "failed";

    // 4. Update Database Record
    payment.status = paymentStatus;
    payment.payhere_status_code = Number(status_code);
    payment.payhere_payment_id = payment_id; // The actual Payhere transaction ID
    payment.payhere_md5sig = md5sig;
    
    await payment.save();

    if (isSuccess) {
        try {
            // await axios.post(`http://appointment-service/internal/confirm/${payment.appointmentId}`);
            console.log(`Payment ${payment.orderId} successful for Appointment ${payment.appointmentId}`);
        } catch (e) {
            console.error("Failed to notify appointment service:", e.message);
        }
    }

    // Always return 200 OK to PayHere to stop them from retrying the webhook
    return res.status(200).send("OK");

  } catch (err) {
    console.error("PayHere Webhook Error:", err);
    return res.status(500).send("Server Error");
  }
};


// Get Payment Status by Appointment ID
export const getPaymentStatus = async (req, res) => {
    try {
        const { appointmentId } = req.params;
        const payment = await Payment.findOne({ appointmentId });

        if (!payment) {
            return res.status(404).json({ message: "Payment record not found for this appointment" });
        }
        return res.json({
            orderId: payment.orderId,
            status: payment.status,
            amount: payment.amount,
            currency: payment.payhere_currency,
            payhere_payment_id: payment.payhere_payment_id
        });
    } catch (err) {
        console.error("Error fetching payment status:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Get All Payments for a logged-in Patient
export const getPatientPayments = async (req, res) => {
    try {
        const patientId = req.user.id; // Assuming req.user is set by auth middleware
        const payments = await Payment.find({ patientId }).sort({ createdAt: -1 });
        return res.json(payments);
    } catch (err) {
        console.error("Error fetching patient payments:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Get All Payments for a logged-in Doctor
export const getDoctorPayments = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const payments = await Payment.find({ doctorId }).sort({ createdAt: -1 });
        return res.json(payments);
    } catch (err) {
        console.error("Error fetching doctor payments:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Get All Payments (Admin)
export const getAllPayments = async (req, res) => {
    try {
        const payments = await Payment.find().sort({ createdAt: -1 });
        return res.json(payments);
    } catch (err) {
        console.error("Error fetching all payments:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Get Payment by ID
export const getPaymentById = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findById(id);

        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }
        return res.json(payment);
    } catch (err) {
        console.error("Error fetching payment by ID:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Delete Payment by ID (Admin)
export const deletePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const payment = await Payment.findByIdAndDelete(id);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }
        return res.json({ message: "Payment deleted successfully" });
    } catch (err) {
        console.error("Error deleting payment:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Update Payment Notes (Admin)
export const updatePaymentNotes = async (req, res) => {
    try {
        const { id } = req.params;
        const { notes } = req.body;
        const payment = await Payment.findById(id);
        if (!payment) {
            return res.status(404).json({ message: "Payment not found" });
        }
        payment.notes = notes;
        await payment.save();
        return res.json({ message: "Payment notes updated successfully", payment });
    } catch (err) {
        console.error("Error updating payment notes:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Get All Payments for a specific doctor (Admin)
export const getPaymentsByDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const payments = await Payment.find({ doctorId }).sort({ createdAt: -1 });
        return res.json(payments);
    } catch (err) {
        console.error("Error fetching payments by doctor:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Get All Payments for a specific patient (Admin)
export const getPaymentsByPatient = async (req, res) => {
    try {
        const { patientId } = req.params;
        const payments = await Payment.find({ patientId }).sort({ createdAt: -1 });
        return res.json(payments);
    } catch (err) {
        console.error("Error fetching payments by patient:", err);
        return res.status(500).json({ message: "Server error" });
    }
};

// Get Payment Status by Order ID (Admin)
export const getPaymentStatusByOrderId = async (req, res) => {
    try {
        const { orderId } = req.params;
        const payment = await Payment.findOne({ orderId });

        if (!payment) {
            return res.status(404).json({ message: "Payment record not found for this order ID" });
        }
        return res.json({
            orderId: payment.orderId,
            status: payment.status,
            amount: payment.amount,
            currency: payment.payhere_currency,
            payhere_payment_id: payment.payhere_payment_id
        });
    } catch (err) {
        console.error("Error fetching payment status by order ID:", err);
        return res.status(500).json({ message: "Server error" });
    }
};