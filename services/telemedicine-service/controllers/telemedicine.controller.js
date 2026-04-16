import crypto from 'node:crypto';
import mongoose from 'mongoose';
import axios from 'axios';
import { ApiError, ApiResponse } from '@healthbridge/shared';
import VideoSession from '../models/VideoSession.js';
import { buildAgoraRtcToken } from '../utils/agoraToken.js';

const DEFAULT_TTL_SECONDS = Number(process.env.AGORA_TOKEN_TTL_SECONDS || 3600);
const MIN_TTL_SECONDS = 300;
const MAX_TTL_SECONDS = 7200;

// ─── Internal Service Communication ──
const getAppointmentServiceUrl = () => {
    return process.env.APPOINTMENT_SERVICE_URL || 'http://localhost:3004';
};

const getInternalServiceKey = () => {
    return process.env.INTERNAL_SERVICE_SECRET || 'internal-service-key';
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
            headers: {
                'x-internal-service-key': getInternalServiceKey(),
            },
            timeout: 8000,
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
            headers: {
                'x-internal-service-key': getInternalServiceKey(),
            },
            timeout: 8000,
        });

        return response.data?.data || response.data;
    } catch (error) {
        console.error('[Telemedicine] Failed to fetch appointment:', error.message);
        throw new ApiError(404, 'Appointment not found or appointment service is unavailable');
    }
};

const toObjectId = (value, fieldName) => {
    if (!value || !mongoose.Types.ObjectId.isValid(value)) {
        throw new ApiError(400, `Invalid ${fieldName}`);
    }
    return new mongoose.Types.ObjectId(value);
};

const isParticipant = (session, userId) => {
    const normalizedUserId = String(userId);
    return String(session.doctorId) === normalizedUserId || String(session.patientId) === normalizedUserId;
};

const ensureCanViewSession = (session, user) => {
    if (user.role === 'Admin') {
        return;
    }

    if (!isParticipant(session, user.id)) {
        throw new ApiError(403, 'Forbidden: You are not a participant in this session.');
    }
};

const ensureDoctorOwnsSession = (session, user) => {
    if (user.role !== 'Doctor' || String(session.doctorId) !== String(user.id)) {
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

export const createVideoSession = async (req, res, next) => {
    try {
        const { appointmentId, patientId, doctorId, scheduledAt, metadata } = req.body;

        if (!patientId) {
            throw new ApiError(400, 'patientId is required.');
        }

        let resolvedDoctorId = doctorId;

        if (req.user.role === 'Doctor') {
            resolvedDoctorId = req.user.id;
        }

        if (!resolvedDoctorId) {
            throw new ApiError(400, 'doctorId is required.');
        }

        // ─── Validate Payment Status if appointmentId is provided ──
        if (appointmentId) {
            try {
                const appointment = await fetchAppointmentById(appointmentId);
                
                if (!appointment) {
                    throw new ApiError(404, 'Appointment not found');
                }

                // Check if payment is completed
                if (appointment.paymentStatus !== 'Completed') {
                    throw new ApiError(402, `Session can only be created after payment is completed. Current payment status: ${appointment.paymentStatus}`);
                }

                // Check if appointment is accepted
                if (appointment.status !== 'Accepted') {
                    throw new ApiError(409, `Appointment must be accepted by doctor first. Current status: ${appointment.status}`);
                }
            } catch (error) {
                if (error instanceof ApiError) {
                    throw error;
                }
                // If appointment service is down, still allow creation (fallback)
                console.warn('[Telemedicine] Warning: Could not verify appointment payment status');
            }
        }

        const session = await VideoSession.create({
            appointmentId,
            channelName: `hb-${crypto.randomBytes(8).toString('hex')}`,
            doctorId: toObjectId(resolvedDoctorId, 'doctorId'),
            patientId: toObjectId(patientId, 'patientId'),
            createdBy: toObjectId(req.user.id, 'createdBy'),
            scheduledAt,
            metadata,
            agora: {
                tokenTTLSeconds: DEFAULT_TTL_SECONDS
            }
        });

        res.status(201).json(
            new ApiResponse(
                201,
                session,
                'Video consultation session created successfully.'
            )
        );
    } catch (error) {
        next(error);
    }
};

export const listMyVideoSessions = async (req, res, next) => {
    try {
        const { status } = req.query;
        const query = {};

        if (status) {
            query.status = status;
        }

        if (req.user.role === 'Doctor') {
            query.doctorId = req.user.id;
        }

        if (req.user.role === 'Patient') {
            query.patientId = req.user.id;
        }

        if (req.user.role === 'Admin') {
            if (req.query.doctorId) {
                query.doctorId = req.query.doctorId;
            }
            if (req.query.patientId) {
                query.patientId = req.query.patientId;
            }
        }

        const sessions = await VideoSession.find(query).sort({ createdAt: -1 }).limit(100);

        res.status(200).json(new ApiResponse(200, sessions, 'Video sessions retrieved successfully.'));
    } catch (error) {
        next(error);
    }
};

export const getVideoSessionById = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            throw new ApiError(400, 'Invalid sessionId.');
        }

        const session = await VideoSession.findById(sessionId);

        if (!session) {
            throw new ApiError(404, 'Video session not found.');
        }

        ensureCanViewSession(session, req.user);

        res.status(200).json(new ApiResponse(200, session, 'Video session retrieved successfully.'));
    } catch (error) {
        next(error);
    }
};

export const issueVideoSessionToken = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            throw new ApiError(400, 'Invalid sessionId.');
        }

        const session = await VideoSession.findById(sessionId);

        if (!session) {
            throw new ApiError(404, 'Video session not found.');
        }

        ensureCanViewSession(session, req.user);

        if (session.status === 'completed' || session.status === 'cancelled') {
            throw new ApiError(409, `Cannot join a ${session.status} session.`);
        }

        const ttlSeconds = clampTtl(req.query.ttl);

        const tokenPayload = buildAgoraRtcToken({
            channelName: session.channelName,
            userAccount: req.user.id,
            role: 'publisher',
            ttlSeconds
        });

        session.agora = {
            ...session.agora,
            tokenTTLSeconds: ttlSeconds,
            lastIssuedAt: new Date()
        };

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

        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            throw new ApiError(400, 'Invalid sessionId.');
        }

        const session = await VideoSession.findById(sessionId);

        if (!session) {
            throw new ApiError(404, 'Video session not found.');
        }

        ensureDoctorOwnsSession(session, req.user);

        if (session.status === 'completed' || session.status === 'cancelled') {
            throw new ApiError(409, `Cannot start a ${session.status} session.`);
        }

        if (session.status !== 'active') {
            session.status = 'active';
            session.startedAt = new Date();
            await session.save();
        }

        res.status(200).json(new ApiResponse(200, session, 'Video session started.'));
    } catch (error) {
        next(error);
    }
};

export const endVideoSession = async (req, res, next) => {
    try {
        const { sessionId } = req.params;

        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            throw new ApiError(400, 'Invalid sessionId.');
        }

        const session = await VideoSession.findById(sessionId);

        if (!session) {
            throw new ApiError(404, 'Video session not found.');
        }

        ensureDoctorOwnsSession(session, req.user);

        if (session.status === 'cancelled') {
            throw new ApiError(409, 'Cannot end a cancelled session.');
        }

        session.status = 'completed';
        session.endedAt = new Date();

        if (!session.startedAt) {
            session.startedAt = session.endedAt;
        }

        await session.save();

        res.status(200).json(new ApiResponse(200, session, 'Video session ended.'));
    } catch (error) {
        next(error);
    }
};

// ─── Get online appointments with video sessions (for telehealth) ──
export const getOnlineAppointmentsWithSessions = async (req, res, next) => {
    try {
        let query = {};

        // Filter by role
        if (req.user.role === 'Doctor') {
            query.doctorId = req.user.id;
        } else if (req.user.role === 'Patient') {
            query.patientId = req.user.id;
        } else if (req.user.role !== 'Admin') {
            throw new ApiError(403, 'Unauthorized');
        }

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

// ─── Update video session status linked to appointment ──
export const updateSessionStatus = async (req, res, next) => {
    try {
        const { sessionId } = req.params;
        const { status } = req.body;

        if (!mongoose.Types.ObjectId.isValid(sessionId)) {
            throw new ApiError(400, 'Invalid sessionId.');
        }

        const validStatuses = ['scheduled', 'active', 'completed', 'cancelled'];
        if (!validStatuses.includes(status)) {
            throw new ApiError(400, 'Invalid status');
        }

        const session = await VideoSession.findById(sessionId);

        if (!session) {
            throw new ApiError(404, 'Video session not found.');
        }

        ensureDoctorOwnsSession(session, req.user);

        session.status = status;

        if (status === 'active' && !session.startedAt) {
            session.startedAt = new Date();
        }

        if (status === 'completed' && !session.endedAt) {
            session.endedAt = new Date();
        }

        if (status === 'cancelled' && !session.endedAt) {
            session.endedAt = new Date();
        }

        await session.save();

        res.status(200).json(
            new ApiResponse(200, session, `Video session status updated to ${status}.`)
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

        const { doctorId, patientId, startTime, endTime, reason, notes } = appointment;

        if (!doctorId || !patientId) {
            throw new ApiError(400, 'Appointment must have both doctorId and patientId');
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
            channelName: `hb-${crypto.randomBytes(8).toString('hex')}`,
            doctorId: toObjectId(doctorId, 'doctorId'),
            patientId: toObjectId(patientId, 'patientId'),
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
        const tokenPayload = buildAgoraRtcToken({
            channelName: session.channelName,
            userAccount: String(doctorId),
            role: 'publisher',
            ttlSeconds: DEFAULT_TTL_SECONDS
        });

        session.agora = {
            ...session.agora,
            lastIssuedAt: new Date()
        };

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