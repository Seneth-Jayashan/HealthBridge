import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { Camera, CameraOff, LoaderCircle, Mic, MicOff, PhoneOff, Users } from 'lucide-react';

const parsedLogLevel = Number(import.meta.env.VITE_AGORA_LOG_LEVEL ?? 2);
const AGORA_LOG_LEVEL = Number.isFinite(parsedLogLevel) ? parsedLogLevel : 2;
const parsedProxyMode = Number(import.meta.env.VITE_AGORA_PROXY_MODE ?? 0);
const AGORA_PROXY_MODE = parsedProxyMode === 3 || parsedProxyMode === 5 ? parsedProxyMode : 0;
const normalizeUid = (uid) => String(uid);

if (typeof AgoraRTC.setLogLevel === 'function') {
  AgoraRTC.setLogLevel(AGORA_LOG_LEVEL);
}

const VideoConsultRoom = ({ joinPayload, displayName, onLeave }) => {
  const clientRef = useRef(null);
  const localTracksRef = useRef({ audioTrack: null, videoTrack: null });
  const remoteVideoTracksRef = useRef(new Map());
  const localVideoRef = useRef(null);

  const [connectionState, setConnectionState] = useState('idle');
  const [error, setError] = useState('');
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);

  const leaveCall = useCallback(async (notifyParent = true) => {
    const { audioTrack, videoTrack } = localTracksRef.current;

    if (audioTrack) {
      audioTrack.stop();
      audioTrack.close();
    }

    if (videoTrack) {
      videoTrack.stop();
      videoTrack.close();
    }

    localTracksRef.current = { audioTrack: null, videoTrack: null };
    remoteVideoTracksRef.current.clear();

    if (clientRef.current) {
      if (AGORA_PROXY_MODE && typeof clientRef.current.stopProxyServer === 'function') {
        clientRef.current.stopProxyServer();
      }
      clientRef.current.removeAllListeners();
      await clientRef.current.leave();
      clientRef.current = null;
    }

    setRemoteParticipants([]);
    setIsMicEnabled(true);
    setIsCameraEnabled(true);
    setConnectionState('idle');

    if (notifyParent) {
      onLeave?.();
    }
  }, [onLeave]);

  const playRemoteVideoTrack = useCallback((uid) => {
    const normalizedUid = normalizeUid(uid);
    const videoTrack = remoteVideoTracksRef.current.get(normalizedUid);

    if (!videoTrack) {
      return;
    }

    const targetElement = document.getElementById(`remote-player-${normalizedUid}`);

    if (!targetElement) {
      return;
    }

    videoTrack.play(targetElement);
  }, []);

  const joinCall = useCallback(async (payload) => {
    if (!payload?.appId || !payload?.channelName || !payload?.token) {
      setError('Missing Agora join details. Please request a new token.');
      return;
    }

    await leaveCall(false);
    setConnectionState('joining');
    setError('');

    try {
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      if (AGORA_PROXY_MODE && typeof client.startProxyServer === 'function') {
        client.startProxyServer(AGORA_PROXY_MODE);
      }

      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);

        const normalizedUid = normalizeUid(user.uid);

        if (mediaType === 'audio') {
          user.audioTrack?.play();
          return;
        }

        if (mediaType === 'video') {
          remoteVideoTracksRef.current.set(normalizedUid, user.videoTrack);
          setRemoteParticipants((prev) => (
            prev.includes(normalizedUid) ? prev : [...prev, normalizedUid]
          ));

          window.setTimeout(() => {
            playRemoteVideoTrack(normalizedUid);
          }, 0);
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        const normalizedUid = normalizeUid(user.uid);

        if (mediaType === 'video') {
          remoteVideoTracksRef.current.delete(normalizedUid);
          setRemoteParticipants((prev) => prev.filter((uid) => uid !== normalizedUid));
        }
      });

      client.on('user-left', (user) => {
        const normalizedUid = normalizeUid(user.uid);
        remoteVideoTracksRef.current.delete(normalizedUid);
        setRemoteParticipants((prev) => prev.filter((uid) => uid !== normalizedUid));
      });

      const joinIdentity = payload.account
        ? String(payload.account)
        : (payload.uid !== undefined && payload.uid !== null ? Number(payload.uid) : null);

      await client.join(payload.appId, payload.channelName, payload.token, joinIdentity);

      const [audioTrack, videoTrack] = await Promise.all([
        AgoraRTC.createMicrophoneAudioTrack(),
        AgoraRTC.createCameraVideoTrack()
      ]);

      localTracksRef.current = { audioTrack, videoTrack };

      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }

      await client.publish([audioTrack, videoTrack]);
      setConnectionState('joined');
    } catch (joinError) {
      setError(joinError?.message || 'Unable to join the consultation room.');
      await leaveCall(false);
      setConnectionState('error');
    }
  }, [leaveCall, playRemoteVideoTrack]);

  useEffect(() => {
    if (!joinPayload?.sessionId) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      joinCall(joinPayload);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [joinPayload, joinCall]);

  useEffect(() => {
    if (remoteParticipants.length === 0) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      remoteParticipants.forEach((uid) => {
        playRemoteVideoTrack(uid);
      });
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [remoteParticipants, playRemoteVideoTrack]);

  useEffect(() => {
    return () => {
      leaveCall(false);
    };
  }, [leaveCall]);

  const toggleMic = async () => {
    const track = localTracksRef.current.audioTrack;
    if (!track) return;

    const nextEnabled = !isMicEnabled;
    await track.setEnabled(nextEnabled);
    setIsMicEnabled(nextEnabled);
  };

  const toggleCamera = async () => {
    const track = localTracksRef.current.videoTrack;
    if (!track) return;

    const nextEnabled = !isCameraEnabled;
    await track.setEnabled(nextEnabled);
    setIsCameraEnabled(nextEnabled);
  };

  const roomTitle = useMemo(() => {
    if (!joinPayload?.channelName) {
      return 'No consultation selected';
    }

    return `Channel: ${joinPayload.channelName}`;
  }, [joinPayload]);

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Consultation</p>
          <h3 className="text-lg font-black text-slate-900">{roomTitle}</h3>
          <p className="text-sm text-slate-600">Connected as {displayName || 'Participant'}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
          <Users size={14} />
          <span>{remoteParticipants.length + (connectionState === 'joined' ? 1 : 0)} participant(s)</span>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <article className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
          <div className="border-b border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            You
          </div>
          <div ref={localVideoRef} className="h-64 w-full bg-slate-950" />
        </article>

        <article className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
          <div className="border-b border-slate-700 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-300">
            Remote
          </div>
          <div className="h-64 overflow-auto p-2">
            {remoteParticipants.length === 0 ? (
              <div className="flex h-full items-center justify-center rounded-lg border border-dashed border-slate-600 text-sm font-medium text-slate-400">
                Waiting for the other participant to join...
              </div>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {remoteParticipants.map((uid) => (
                  <div key={uid} className="overflow-hidden rounded-lg border border-slate-700 bg-slate-950">
                    <div className="border-b border-slate-700 px-2 py-1 text-[11px] font-semibold text-slate-300">Remote {String(uid)}</div>
                    <div id={`remote-player-${uid}`} className="h-36 w-full" />
                  </div>
                ))}
              </div>
            )}
          </div>
        </article>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={toggleMic}
          disabled={connectionState !== 'joined'}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isMicEnabled ? <Mic size={16} /> : <MicOff size={16} />}
          <span>{isMicEnabled ? 'Mute Mic' : 'Unmute Mic'}</span>
        </button>

        <button
          type="button"
          onClick={toggleCamera}
          disabled={connectionState !== 'joined'}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isCameraEnabled ? <Camera size={16} /> : <CameraOff size={16} />}
          <span>{isCameraEnabled ? 'Turn Camera Off' : 'Turn Camera On'}</span>
        </button>

        <button
          type="button"
          onClick={() => leaveCall(true)}
          disabled={connectionState !== 'joined' && connectionState !== 'joining'}
          className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {connectionState === 'joining' ? <LoaderCircle size={16} className="animate-spin" /> : <PhoneOff size={16} />}
          <span>{connectionState === 'joining' ? 'Joining...' : 'Leave Call'}</span>
        </button>
      </div>
    </section>
  );
};

export default VideoConsultRoom;
