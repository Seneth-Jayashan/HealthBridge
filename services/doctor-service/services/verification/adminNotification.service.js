import axios from 'axios';

const getAdminTargets = async () => {
  const authBaseUrl = process.env.AUTH_SERVICE_URL || 'http://localhost:3001';
  const endpoint = `${authBaseUrl.replace(/\/$/, '')}/internal/admins`;

  const response = await axios.get(endpoint, {
    headers: {
      'x-internal-service-key': process.env.INTERNAL_SERVICE_SECRET,
    },
    timeout: 8000,
  });

  const admins = response.data?.data || [];

  return admins.map((admin) => admin._id);
};

export const notifyAdminsDoctorVerificationRequested = async ({ requesterUserId, specialization, registrationNumber }) => {
  const adminTargets = await getAdminTargets();

  if (adminTargets.length === 0) {
    return;
  }

  const notificationBaseUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';
  const normalizedBaseUrl = notificationBaseUrl.replace(/\/$/, '');
  const endpoint = normalizedBaseUrl.endsWith('/api/notifications')
    ? normalizedBaseUrl
    : `${normalizedBaseUrl}/api/notifications`;

  const title = 'Doctor Verification Request Submitted';
  const message = `A doctor has submitted a verification request. Specialization: ${specialization || 'N/A'}, Registration: ${registrationNumber || 'N/A'}.`;

  await Promise.all(
    adminTargets.map(async (userId) => {
      await axios.post(
        endpoint,
        {
          userId,
          notificationType: ['SMS', 'Email', 'In-App'],
          notificationTemplate: 'DOCTOR_VERIFICATION_REQUEST',
          title,
          message,
        },
        {
          headers: {
            'x-user-id': requesterUserId,
            'x-user-role': 'Doctor',
          },
          timeout: 8000,
        }
      );
    })
  );
};
