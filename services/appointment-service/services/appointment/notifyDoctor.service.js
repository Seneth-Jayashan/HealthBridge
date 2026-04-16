import axios from 'axios';

export const notifyDoctorNewAppointment = async ({
  patientUserId,
  doctorUserId,
  appointmentId,
  appointmentDate,
  appointmentTime,
}) => {
  if (!doctorUserId) {
    return;
  }

  const notificationBaseUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';
  const normalizedBaseUrl = notificationBaseUrl.replace(/\/$/, '');
  const endpoint = normalizedBaseUrl.endsWith('/api/notifications')
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api/notifications`;

  const title = 'New Appointment Scheduled';
  const message = `You have a new appointment scheduled for ${appointmentDate || 'N/A'} at ${appointmentTime || 'N/A'}. Appointment ID: ${appointmentId || 'N/A'}.`;

  await axios.post(
    endpoint,
    {
      userId: doctorUserId,
      notificationType: ['SMS', 'Email', 'In-App'], // Adjust if you want fewer channels for appointments
      notificationTemplate: 'NEW_APPOINTMENT_SCHEDULED',
      title,
      message,
    },
    {
      headers: {
        'x-user-id': patientUserId, // The patient triggering the action
        'x-user-role': 'Patient',   // The role of the user triggering the action
      },
      timeout: 8000,
    }
  );
};

export const notifyDoctorPaymentStatusUpdate = async ({
  patientUserId,
  doctorUserId,
  appointmentId,
  appointmentDate,
  appointmentTime,
  paymentStatus,
}) => {
  if (!doctorUserId || !paymentStatus) {
    return;
  }

  const notificationBaseUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';
  const normalizedBaseUrl = notificationBaseUrl.replace(/\/$/, '');
  const endpoint = normalizedBaseUrl.endsWith('/api/notifications')
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api/notifications`;

  const title = 'Appointment Payment Update';
  const message = `Payment status for appointment ${appointmentId || 'N/A'} is now ${paymentStatus}.`
    + ` Appointment time: ${appointmentDate || 'N/A'} at ${appointmentTime || 'N/A'}.`;

  await axios.post(
    endpoint,
    {
      userId: doctorUserId,
      notificationType: ['SMS', 'Email', 'In-App'],
      notificationTemplate: 'APPOINTMENT_PAYMENT_STATUS_UPDATED',
      title,
      message,
    },
    {
      headers: {
        'x-user-id': patientUserId, // The patient completing payment
        'x-user-role': 'Patient',
      },
      timeout: 8000,
    }
  );
};