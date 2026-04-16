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

const getPatientServiceUrl = () => {
    return process.env.PATIENT_SERVICE_URL || 'http://localhost:3002';
};

const getDoctorServiceUrl = () => {
    return process.env.DOCTOR_SERVICE_URL || 'http://localhost:3003';
};

const getInternalServiceKey = () => {
    return process.env.INTERNAL_SERVICE_SECRET || 'internal-service-key';
};

const getPatientByIdInternal = async (patientId) => {
    try {
        const patientBaseUrl = getPatientServiceUrl();
        const endpoint = `${patientBaseUrl}/internal/get-patient/${patientId}`;

        const response = await axios.get(endpoint, {
            headers: {
                'x-internal-service-key': getInternalServiceKey(),
            },
            timeout: 8000,
        });

        return response.data?.data || response.data;
    } catch (error) {
        console.error('[Telemedicine] Failed to fetch patient:', error.message);
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

const resolveParticipantIdFromUser = async (user) => {
    if (user.role === 'Doctor') {
        return resolveDoctorProfileIdFromUser(user);
    }

    if (user.role === 'Patient') {
        const patient = await getPatientByIdInternal(user.id);
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

export const createVideoSession = async (req, res, next) => {
    try {
        const { appointmentId, patientId, doctorId, scheduledAt, metadata } = req.body;

        if (!patientId) {
            throw new ApiError(400, 'patientId is required.');
        }

        let resolvedDoctorId = doctorId;

        if (req.user.role === 'Doctor') {
            resolvedDoctorId = await resolveDoctorProfileIdFromUser(req.user);
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
            query.doctorId = await resolveDoctorProfileIdFromUser(req.user);
        }

        if (req.user.role === 'Patient') {
            const patient = await getPatientByIdInternal(req.user.id);
            query.patientId = patient._id;
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
        console.log(`[Telemedicine] Retrieved ${sessions.length} sessions for user ${req.user.id} with role ${req.user.role}`);

        res.status(200).json(new ApiResponse(200, sessions, 'Video sessions retrieved successfully.'));
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

        await ensureCanViewSession(session, req.user);

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

        await ensureDoctorOwnsSession(session, req.user);

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

        await ensureDoctorOwnsSession(session, req.user);

        if (session.status === 'cancelled') {
            throw new ApiError(409, 'Cannot end a cancelled session.');
        }

        // Delete the session from database
        await VideoSession.findByIdAndDelete(sessionId);

        res.status(200).json(new ApiResponse(200, { sessionId }, 'Video session ended and deleted.'));
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

        const { doctorId, patientId, startTime, endTime, reason, notes } = appointment;

        if (!doctorId || !patientId) {
            throw new ApiError(400, 'Appointment must have both doctorId and patientId');
        }

        const patient = await getPatientByIdInternal(patientId);

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
            channelName: `hb-${crypto.randomBytes(8).toString('hex')}`,
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

const getDoctorByUserIdInternal = async (userId) => {
    try {
        const doctorBaseUrl = getDoctorServiceUrl();
        const endpoint = `${doctorBaseUrl}/internal/get-doctor/${userId}`;

        const response = await axios.get(endpoint, {
            headers: {
                'x-internal-service-key': getInternalServiceKey(),
            },
            timeout: 8000,
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