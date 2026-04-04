import express from 'express';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3005;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

app.get('/health', (req, res) => {
  res.json({ status: 'appointment-service running' });
});

app.listen(PORT, () => {
  console.log(`Appointment service running on port ${PORT}`);
});