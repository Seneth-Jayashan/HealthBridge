import axios from 'axios';

export const notifyPatientDoctorDecision = async ({
  doctorUserId,
  patientUserId,
  appointmentId,
  appointmentDate,
  appointmentTime,
  decision, // 'Accepted' or 'Rejected'
  note,     // Optional note from the doctor
}) => {
  if (!patientUserId || !['Accepted', 'Rejected'].includes(decision)) {
    return;
  }

  const notificationBaseUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';
  const normalizedBaseUrl = notificationBaseUrl.replace(/\/$/, '');
  const endpoint = normalizedBaseUrl.endsWith('/api/notifications')
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api/notifications`;

  const isAccepted = decision === 'Accepted';
  const title = isAccepted ? 'Appointment Accepted' : 'Appointment Rejected';
  
  let message = isAccepted
    ? `Your appointment for ${appointmentDate || 'N/A'} at ${appointmentTime || 'N/A'} has been accepted by the doctor.`
    : `Your appointment for ${appointmentDate || 'N/A'} at ${appointmentTime || 'N/A'} was rejected by the doctor.`;

  if (!isAccepted && note) {
    message += ` Reason: ${note}`;
  }

  await axios.post(
    endpoint,
    {
      userId: patientUserId,
      notificationType: ['SMS', 'Email', 'In-App'],
      notificationTemplate: isAccepted ? 'APPOINTMENT_ACCEPTED' : 'APPOINTMENT_REJECTED',
      title,
      message,
    },
    {
      headers: {
        'x-user-id': doctorUserId, // The doctor making the decision
        'x-user-role': 'Doctor',
      },
      timeout: 8000,
    }
  );
};