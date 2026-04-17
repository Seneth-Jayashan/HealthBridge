import crypto from 'node:crypto';
import AgoraToken from 'agora-token';
import { ApiError } from '@healthbridge/shared';

const { RtcRole, RtcTokenBuilder } = AgoraToken;

const DEFAULT_TTL_SECONDS = Number(process.env.AGORA_TOKEN_TTL_SECONDS || 3600);

const toRtcRole = (role) => {
    return role === 'subscriber' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER;
};

const toDeterministicUid = (userAccount) => {
    const hash = crypto.createHash('sha256').update(String(userAccount)).digest('hex');
    return parseInt(hash.slice(0, 8), 16);
};

const ensureAgoraConfigured = () => {
    if (!process.env.AGORA_APP_ID || !process.env.AGORA_APP_CERTIFICATE) {
        throw new ApiError(500, 'Agora is not configured. Missing AGORA_APP_ID or AGORA_APP_CERTIFICATE.');
    }
};

export const buildAgoraRtcToken = ({ channelName, userAccount, role = 'publisher', ttlSeconds = DEFAULT_TTL_SECONDS }) => {
    ensureAgoraConfigured();

    const expiresAt = Math.floor(Date.now() / 1000) + Number(ttlSeconds);
    const rtcRole = toRtcRole(role);

    if (typeof RtcTokenBuilder.buildTokenWithAccount === 'function') {
        const token = RtcTokenBuilder.buildTokenWithAccount(
            process.env.AGORA_APP_ID,
            process.env.AGORA_APP_CERTIFICATE,
            channelName,
            String(userAccount),
            rtcRole,
            expiresAt
        );

        return {
            token,
            appId: process.env.AGORA_APP_ID,
            channelName,
            account: String(userAccount),
            expiresAt
        };
    }

    const uid = toDeterministicUid(userAccount);
    const token = RtcTokenBuilder.buildTokenWithUid(
        process.env.AGORA_APP_ID,
        process.env.AGORA_APP_CERTIFICATE,
        channelName,
        uid,
        rtcRole,
        expiresAt
    );

    return {
        token,
        appId: process.env.AGORA_APP_ID,
        channelName,
        uid,
        expiresAt
    };
};