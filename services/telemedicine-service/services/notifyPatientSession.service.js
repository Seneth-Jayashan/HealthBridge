import axios from 'axios';

export const notifyPatientSessionStarted = async ({
    doctorUserId,
    patientUserId,
    sessionId,
    appointmentId,
    scheduledAt
}) => {
    if (!patientUserId) {
        return;
    }

    const notificationBaseUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3006';
    const normalizedBaseUrl = notificationBaseUrl.replace(/\/$/, '');
    const endpoint = normalizedBaseUrl.endsWith('/api/notifications')
        ? normalizedBaseUrl
        : `${normalizedBaseUrl}/api/notifications`;

    const title = 'Video Session Started';
    const message = `Your doctor has started the session${appointmentId ? ` for appointment ${appointmentId}` : ''}.`
        + ` Session ID: ${sessionId || 'N/A'}. Scheduled: ${scheduledAt || 'N/A'}.`;

    await axios.post(
        endpoint,
        {
            userId: patientUserId,
            notificationType: ['SMS', 'Email', 'In-App'],
            notificationTemplate: 'VIDEO_SESSION_STARTED',
            title,
            message,
        },
        {
            headers: {
                'x-user-id': doctorUserId,
                'x-user-role': 'Doctor',
            },
            timeout: 8000,
        }
    );
};
