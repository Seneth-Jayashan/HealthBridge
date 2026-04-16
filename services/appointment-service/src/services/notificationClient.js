import axios from 'axios';

const normalizeBaseUrl = (url) => String(url || '').replace(/\/$/, '');

const resolveNotificationBaseCandidates = () => {
	const configured = normalizeBaseUrl(process.env.NOTIFICATION_SERVICE_URL);
	const candidates = [configured, 'http://notification-service:3006', 'http://localhost:3006']
		.filter(Boolean)
		.map((url) => normalizeBaseUrl(url));

	return [...new Set(candidates)];
};

const toNotificationEndpoint = (baseUrl) => {
	return baseUrl.endsWith('/api/notifications') ? baseUrl : `${baseUrl}/api/notifications`;
};

const resolveDoctorServiceBaseUrl = () => {
	return normalizeBaseUrl(process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003');
};

const client = axios.create({ timeout: 8000 });

export const resolveDoctorUserIdForNotification = async ({ doctorId, actorUserId, actorRole }) => {
	if (!doctorId || !actorUserId || !actorRole) return null;

	const doctorBaseUrl = resolveDoctorServiceBaseUrl();
	const endpoint = `${doctorBaseUrl}/internal/doctors/${doctorId}/basic`;

	const response = await client.get(endpoint, {
		headers: {
			'x-internal-service-key': process.env.INTERNAL_SERVICE_SECRET,
			'x-user-id': actorUserId,
			'x-user-role': actorRole,
		},
	});

	return response?.data?.data?.userId || null;
};

export const sendInAppNotification = async ({
	actorUserId,
	actorRole,
	targetUserId,
	title,
	message,
	notificationTemplate = 'APPOINTMENT_UPDATE',
}) => {
	if (!actorUserId || !actorRole || !targetUserId || !title || !message) {
		return;
	}

	const payload = {
		userId: targetUserId,
		notificationType: ['In-App'],
		notificationTemplate,
		title,
		message,
	};

	const requestConfig = {
		headers: {
			'x-user-id': actorUserId,
			'x-user-role': actorRole,
		},
	};

	let lastError;
	for (const baseUrl of resolveNotificationBaseCandidates()) {
		try {
			await client.post(toNotificationEndpoint(baseUrl), payload, requestConfig);
			return;
		} catch (error) {
			lastError = error;
			if (error?.response?.status && error.response.status < 500) break;
		}
	}

	throw lastError || new Error('Notification delivery failed');
};
