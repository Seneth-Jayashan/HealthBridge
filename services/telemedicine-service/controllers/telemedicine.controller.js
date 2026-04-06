import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { ApiError, ApiResponse } from '@healthbridge/shared';
import VideoSession from '../models/VideoSession.js';
import { buildAgoraRtcToken } from '../utils/agoraToken.js';

const DEFAULT_TTL_SECONDS = Number(process.env.AGORA_TOKEN_TTL_SECONDS || 3600);
const MIN_TTL_SECONDS = 300;
const MAX_TTL_SECONDS = 7200;

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