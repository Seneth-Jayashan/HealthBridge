import axios from 'axios';

export const notifyDoctorVerificationDecision = async ({
  requesterUserId,
  doctorUserId,
  verificationStatus,
  doctorID,
  specialization,
}) => {
  if (!['Approved', 'Rejected'].includes(verificationStatus)) {
    return;
  }

  const notificationBaseUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';
  const normalizedBaseUrl = notificationBaseUrl.replace(/\/$/, '');
  const endpoint = normalizedBaseUrl.endsWith('/api/notifications')
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api/notifications`;

  const title = verificationStatus === 'Approved'
    ? 'Doctor Verification Approved'
    : 'Doctor Verification Rejected';

  const message = verificationStatus === 'Approved'
    ? `Your verification request has been approved. Doctor ID: ${doctorID || 'N/A'}, Specialization: ${specialization || 'N/A'}.`
    : 'Your verification request has been rejected. Please contact admin for more information.';

  await axios.post(
    endpoint,
    {
      userId: doctorUserId,
      notificationType: ['SMS', 'Email', 'In-App'],
      notificationTemplate:
        verificationStatus === 'Approved'
          ? 'DOCTOR_VERIFICATION_APPROVED'
          : 'DOCTOR_VERIFICATION_REJECTED',
      title,
      message,
    },
    {
      headers: {
        'x-user-id': requesterUserId,
        'x-user-role': 'Admin',
      },
      timeout: 8000,
    }
  );
};
