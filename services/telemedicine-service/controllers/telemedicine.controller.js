import crypto from 'node:crypto';
import mongoose from 'mongoose';
import axios from 'axios';
import { ApiError, ApiResponse } from '@healthbridge/shared';
import VideoSession from '../models/VideoSession.js';
import { buildAgoraRtcToken } from '../utils/agoraToken.js';
import { notifyPatientSessionStarted } from '../services/notifyPatientSession.service.js';

const DEFAULT_TTL_SECONDS = Number(process.env.AGORA_TOKEN_TTL_SECONDS || 3600);
const MIN_TTL_SECONDS = 300;
const MAX_TTL_SECONDS = 7200;
const INTERNAL_TIMEOUT_MS = 8000;

const getAppointmentServiceUrl = () => process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';
const getPatientServiceUrl = () => process.env.PATIENT_SERVICE_URL || 'http://localhost:3002';
const getDoctorServiceUrl = () => process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003';
const getInternalServiceKey = () => process.env.INTERNAL_SERVICE_SECRET || 'internal-service-key';

const buildInternalHeaders = () => ({
    'x-internal-service-key': getInternalServiceKey(),
});

const createChannelName = () => `hb-${crypto.randomBytes(8).toString('hex')}`;

const assertValidObjectId = (value, fieldName) => {
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
        throw new ApiError(400, `Invalid ${fieldName}`);
    }
};

const getSessionByIdOrThrow = async (sessionId) => {
    assertValidObjectId(sessionId, 'sessionId');

    const session = await VideoSession.findById(sessionId);
    if (!session) {
        throw new ApiError(404, 'Video session not found.');
    }

    return session;
};

const getRoleScopedSessionQuery = async (user, queryParams = {}) => {
    const query = {};

    if (queryParams.status) {
        query.status = queryParams.status;
    }

    if (user.role === 'Doctor') {
        query.doctorId = await resolveDoctorProfileIdFromUser(user);
        return query;
    }

    if (user.role === 'Patient') {
        const patient = await getPatientByUserIdInternal(user.id);
        if (!patient?._id) {
            throw new ApiError(404, 'Patient profile not found.');
        }
        query.patientId = patient._id;
        return query;
    }

    if (user.role === 'Admin') {
        if (queryParams.doctorId) {
            query.doctorId = queryParams.doctorId;
        }
        if (queryParams.patientId) {
            query.patientId = queryParams.patientId;
        }
        return query;
    }

    throw new ApiError(403, 'Unauthorized');
};

const validateAppointmentForSessionCreation = async (appointmentId) => {
    if (!appointmentId) {
        return;
    }

    try {
        const appointment = await fetchAppointmentById(appointmentId);

        if (!appointment) {
            throw new ApiError(404, 'Appointment not found');
        }

        if (appointment.paymentStatus !== 'Completed') {
            throw new ApiError(
                402,
                `Session can only be created after payment is completed. Current payment status: ${appointment.paymentStatus}`
            );
        }

        if (appointment.status !== 'Accepted') {
            throw new ApiError(
                409,
                `Appointment must be accepted by doctor first. Current status: ${appointment.status}`
            );
        }
    } catch (error) {
        if (error instanceof ApiError) {
            throw error;
        }
        console.warn('[Telemedicine] Warning: Could not verify appointment payment status');
    }
};

const issueSessionToken = ({ channelName, userAccount, ttlSeconds = DEFAULT_TTL_SECONDS }) =>
    buildAgoraRtcToken({
        channelName,
        userAccount,
        role: 'publisher',
        ttlSeconds,
    });

const markSessionTokenIssued = (session, ttlSeconds) => {
    session.agora = {
        ...session.agora,
        tokenTTLSeconds: ttlSeconds,
        lastIssuedAt: new Date(),
    };
};

const getPatientByUserIdInternal = async (userId) => {
    try {
        const patientBaseUrl = getPatientServiceUrl();
        const endpoint = `${patientBaseUrl}/internal/get-patient-by-userId/${userId}`;

        const response = await axios.get(endpoint, {
            headers: buildInternalHeaders(),
            timeout: INTERNAL_TIMEOUT_MS,
        });

        return response.data?.data || response.data;
    } catch (error) {
        console.error('[Telemedicine] Failed to fetch patient:', error.message);
        throw new ApiError(404, 'Patient not found or appointment service is unavailable');
    }
};


const getPatientByIdInternal = async (patientId) => {
    try {
        const patientBaseUrl = getPatientServiceUrl();
        const endpoint = `${patientBaseUrl}/internal/get-patient-by-id/${patientId}`;

        const response = await axios.get(endpoint, {
            headers: buildInternalHeaders(),
            timeout: INTERNAL_TIMEOUT_MS,
        });

        return response.data?.data || response.data;
    } catch (error) {
        console.error('[Telemedicine] Failed to fetch patient by id:', error.message);
        throw new ApiError(404, 'Patient not found or appointment service is unavailable');
    }
};


/**
 * Fetch user's online appointments from appointment service (internal API)
 */
const fetchUserOnlineAppointments = async (userId, userRole) => {
    try {
        const appointmentBaseUrl = getAppointmentServiceUrl();
        let endpoint;

        if (userRole === 'Doctor') {
            endpoint = `${appointmentBaseUrl}/internal/doctor/online/${userId}`;
        } else if (userRole === 'Patient') {
            endpoint = `${appointmentBaseUrl}/internal/patient/online/${userId}`;
        } else if (userRole === 'Admin') {
            endpoint = `${appointmentBaseUrl}/internal/appointments/online`;
        } else {
            throw new ApiError(403, 'Invalid user role for appointment access');
        }

        const response = await axios.get(endpoint, {
            headers: buildInternalHeaders(),
            timeout: INTERNAL_TIMEOUT_MS,
        });

        return Array.isArray(response.data?.data) ? response.data.data : (response.data?.appointments || []);
    } catch (error) {
        console.error('[Telemedicine] Failed to fetch online appointments from appointment service:', error.message);
        // If appointment service is down, return empty array instead of failing
        return [];
    }
};

/**
 * Fetch a single appointment by ID from appointment service (internal API)
 */
const fetchAppointmentById = async (appointmentId) => {
    try {
        const appointmentBaseUrl = getAppointmentServiceUrl();
        const endpoint = `${appointmentBaseUrl}/internal/appointments/${appointmentId}`;

        const response = await axios.get(endpoint, {
            headers: buildInternalHeaders(),
            timeout: INTERNAL_TIMEOUT_MS,
        });

        return response.data?.data || response.data;
    } catch (error) {
        console.error('[Telemedicine] Failed to fetch appointment:', error.message);
        throw new ApiError(404, 'Appointment not found or appointment service is unavailable');
    }
};

const toObjectId = (value, fieldName) => {
    assertValidObjectId(value, fieldName);
    return new mongoose.Types.ObjectId(value);
};

const isParticipant = (session, userId) => {
    const normalizedUserId = String(userId);
    return String(session.doctorId) === normalizedUserId || String(session.patientId) === normalizedUserId;
};

const resolveParticipantIdFromUser = async (user) => {
    if (user.role === 'Doctor') {
        return resolveDoctorProfileIdFromUser(user);
    }

    if (user.role === 'Patient') {
        const patient = await getPatientByUserIdInternal(user.id);
        if (!patient?._id) {
            throw new ApiError(404, 'Patient profile not found.');
        }
        return String(patient._id);
    }

    return String(user.id);
};

const ensureCanViewSession = async (session, user) => {
    if (user.role === 'Admin') {
        return;
    }

    const participantId = await resolveParticipantIdFromUser(user);

    if (!isParticipant(session, participantId)) {
        throw new ApiError(403, 'Forbidden: You are not a participant in this session.');
    }
};

const ensureDoctorOwnsSession = async (session, user) => {
    const resolvedDoctorId = await resolveDoctorProfileIdFromUser(user);

    if (user.role !== 'Doctor' || String(session.doctorId) !== String(resolvedDoctorId)) {
        throw new ApiError(403, 'Forbidden: Only the assigned doctor can perform this action.');
    }
};

const clampTtl = (value) => {
    if (!value) {
        return DEFAULT_TTL_SECONDS;
    }

    const parsed = Number(value);

    if (Number.isNaN(parsed)) {
        return DEFAULT_TTL_SECONDS;
    }

    return Math.max(MIN_TTL_SECONDS, Math.min(MAX_TTL_SECONDS, parsed));
};

export const listMyVideoSessions = async (req, res, next) => {
    try {
        const query = await getRoleScopedSessionQuery(req.user, req.query);

        const sessions = await VideoSession.find(query).sort({ createdAt: -1 }).limit(100);
        console.log(`[Telemedicine] Retrieved ${sessions.length} sessions for user ${req.user.id} with role ${req.user.role}`);

        res.status(200).json(new ApiResponse(200, sessions, 'Video sessions retrieved successfully.'));
    } catch (error) {
        next(error);
    }
};

export const issueVideoSessionToken = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const session = await getSessionByIdOrThrow(sessionId);

        await ensureCanViewSession(session, req.user);

        if (session.status === 'completed' || session.status === 'cancelled') {
            throw new ApiError(409, `Cannot join a ${session.status} session.`);
        }

        const ttlSeconds = clampTtl(req.query.ttl);

        const tokenPayload = issueSessionToken({
            channelName: session.channelName,
            userAccount: req.user.id,
            ttlSeconds,
        });

        markSessionTokenIssued(session, ttlSeconds);

        await session.save();

        res.status(200).json(
            new ApiResponse(
                200,
                {
                    sessionId: session._id,
                    status: session.status,
                    ...tokenPayload
                },
                'Agora RTC token issued successfully.'
            )
        );
    } catch (error) {
        next(error);
    }
};

export const startVideoSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const session = await getSessionByIdOrThrow(sessionId);

        await ensureDoctorOwnsSession(session, req.user);

        if (session.status === 'completed' || session.status === 'cancelled') {
            throw new ApiError(409, `Cannot start a ${session.status} session.`);
        }

        if (session.status !== 'active') {
            session.status = 'active';
            session.startedAt = new Date();
            await session.save();
        }

        const patientUserId = await getPatientByIdInternal(session.patientId);
        await notifyPatientSessionStarted({
            doctorUserId: req.user.id,
            patientUserId: patientUserId.userId,
            sessionId: session._id,
            appointmentId: session.appointmentId,
            scheduledAt: session.scheduledAt
        });

        res.status(200).json(new ApiResponse(200, session, 'Video session started.'));
    } catch (error) {
        next(error);
    }
};

export const endVideoSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const session = await getSessionByIdOrThrow(sessionId);

        await ensureDoctorOwnsSession(session, req.user);

        if (session.status === 'cancelled') {
            throw new ApiError(409, 'Cannot end a cancelled session.');
        }

        const endedAt = new Date();
        const startedAt = session.startedAt || endedAt;

        await session.deleteOne();

        res.status(200).json(
            new ApiResponse(
                200,
                {
                    ...session.toObject(),
                    status: 'completed',
                    startedAt,
                    endedAt,
                },
                'Video session ended and removed.'
            )
        );
    } catch (error) {
        next(error);
    }
};

// ─── Get online appointments with video sessions (for telehealth) ──
export const getOnlineAppointmentsWithSessions = async (req, res, next) => {
    try {
        const query = await getRoleScopedSessionQuery(req.user);

        // Get video sessions from telemedicine service
        const sessions = await VideoSession.find(query)
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        // Fetch online appointments from appointment service (internal API)
        const appointments = await fetchUserOnlineAppointments(req.user.id, req.user.role);

        // Return combined data
        res.status(200).json(
            new ApiResponse(200, { sessions, appointments }, 'Online appointments with video sessions retrieved successfully.')
        );
    } catch (error) {
        next(error);
    }
};

// ─── Get patient's online appointments (internal use for Telehealth) ──
export const getPatientOnlineAppointments = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.user.id;

        if (req.user.role === 'Patient' && String(req.user.id) !== String(userId)) {
            throw new ApiError(403, 'Forbidden: You can only access your own appointments.');
        }

        const appointments = await fetchUserOnlineAppointments(userId, 'Patient');

        res.status(200).json(
            new ApiResponse(200, appointments, 'Patient online appointments retrieved successfully.')
        );
    } catch (error) {
        next(error);
    }
};

// ─── Get doctor's online appointments (internal use for Telehealth) ──
export const getDoctorOnlineAppointments = async (req, res, next) => {
    try {
        const userId = req.params.userId || req.user.id;

        if (req.user.role === 'Doctor' && String(req.user.id) !== String(userId)) {
            throw new ApiError(403, 'Forbidden: You can only access your own appointments.');
        }

        const appointments = await fetchUserOnlineAppointments(userId, 'Doctor');

        res.status(200).json(
            new ApiResponse(200, appointments, 'Doctor online appointments retrieved successfully.')
        );
    } catch (error) {
        next(error);
    }
};

// ─── [INTERNAL API] Handle Payment Success - Auto-create telehealth session ──
/**
 * Triggered by appointment service after payment is completed
 * POST /internal/success/:appointmentId
 * - Fetches appointment details
 * - Creates VideoSession automatically
 * - Returns session with Agora token credentials
 */
export const handlePaymentSuccess = async (req, res, next) => {
    try {
        const { appointmentId } = req.params;

        if (!appointmentId) {
            throw new ApiError(400, 'appointmentId is required');
        }

        // Fetch appointment details from appointment service
        const appointment = await fetchAppointmentById(appointmentId);

        if (!appointment) {
            throw new ApiError(404, 'Appointment not found');
        }

        const { doctorId, patientId, reason, notes } = appointment;

        if (!doctorId || !patientId) {
            throw new ApiError(400, 'Appointment must have both doctorId and patientId');
        }

        const patient = await getPatientByUserIdInternal(patientId);

        if (!patient) {
            throw new ApiError(404, 'Patient not found');
        }

        // Check if session already exists for this appointment
        let session = await VideoSession.findOne({ appointmentId });

        if (session) {
            console.log(`[Telemedicine] Video session already exists for appointment ${appointmentId}`);
            // Return existing session with new token
            const ttlSeconds = DEFAULT_TTL_SECONDS;
            const tokenPayload = buildAgoraRtcToken({
                channelName: session.channelName,
                userAccount: doctorId,
                role: 'publisher',
                ttlSeconds
            });

            session.agora = {
                ...session.agora,
                tokenTTLSeconds: ttlSeconds,
                lastIssuedAt: new Date()
            };

            await session.save();

            return res.status(200).json(
                new ApiResponse(200, {
                    session,
                    token: tokenPayload
                }, 'Video session already exists. New token issued.')
            );
        }

        // Create new video session
        session = await VideoSession.create({
            appointmentId,
            channelName: createChannelName(),
            doctorId: toObjectId(doctorId, 'doctorId'),
            patientId: toObjectId(patient._id, 'patientId'),
            createdBy: toObjectId(doctorId, 'createdBy'),
            scheduledAt: appointment.createdAt || new Date(),
            status: 'scheduled',
            metadata: {
                reason: reason || 'Telehealth consultation',
                notes: notes
            },
            agora: {
                tokenTTLSeconds: DEFAULT_TTL_SECONDS
            }
        });

        // Generate Agora token for doctor
        const tokenPayload = issueSessionToken({
            channelName: session.channelName,
            userAccount: String(doctorId),
        });

        markSessionTokenIssued(session, DEFAULT_TTL_SECONDS);

        await session.save();

        console.log(`[Telemedicine] Auto-created video session for appointment ${appointmentId}`);

        res.status(201).json(
            new ApiResponse(201, {
                session,
                token: tokenPayload
            }, 'Video session created successfully after payment completion.')
        );
    } catch (error) {
        console.error('[Telemedicine] Error in handlePaymentSuccess:', error);
        next(error);
    }
};

const getDoctorByUserIdInternal = async (userId) => {
    try {
        const doctorBaseUrl = getDoctorServiceUrl();
        const endpoint = `${doctorBaseUrl}/internal/get-doctor/${userId}`;

        const response = await axios.get(endpoint, {
            headers: buildInternalHeaders(),
            timeout: INTERNAL_TIMEOUT_MS,
        });

        return response.data?.data || response.data;
    } catch (error) {
        console.error('[Telemedicine] Failed to fetch doctor:', error.message);
        throw new ApiError(404, 'Doctor not found or doctor service is unavailable');
    }
};

const resolveDoctorProfileIdFromUser = async (user) => {
    if (user.role !== 'Doctor') {
        return user.id;
    }

    const doctor = await getDoctorByUserIdInternal(user.id);
    if (!doctor?._id) {
        throw new ApiError(404, 'Doctor profile not found. Please complete doctor profile setup.');
    }

    return String(doctor._id);
};