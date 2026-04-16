import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AgoraRTC from 'agora-rtc-sdk-ng';
import { 
  Camera, CameraOff, LoaderCircle, Mic, MicOff, 
  PhoneOff, Users, Stethoscope, Clock, ShieldCheck, 
  Copy, Check, Maximize, Minimize 
} from 'lucide-react';

const parsedLogLevel = Number(import.meta.env.VITE_AGORA_LOG_LEVEL ?? 2);
const AGORA_LOG_LEVEL = Number.isFinite(parsedLogLevel) ? parsedLogLevel : 2;
const parsedProxyMode = Number(import.meta.env.VITE_AGORA_PROXY_MODE ?? 0);
const AGORA_PROXY_MODE = parsedProxyMode === 3 || parsedProxyMode === 5 ? parsedProxyMode : 0;
const normalizeUid = (uid) => String(uid);

if (typeof AgoraRTC.setLogLevel === 'function') {
  AgoraRTC.setLogLevel(AGORA_LOG_LEVEL);
}

const VideoConsultRoom = ({ joinPayload, displayName, onLeave, appointmentDetails }) => {
  const containerRef = useRef(null);
  const clientRef = useRef(null);
  const localTracksRef = useRef({ audioTrack: null, videoTrack: null });
  const remoteVideoTracksRef = useRef(new Map());
  const localVideoRef = useRef(null);

  const [connectionState, setConnectionState] = useState('idle');
  const [error, setError] = useState('');
  const [remoteParticipants, setRemoteParticipants] = useState([]);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Handle Fullscreen Toggle
  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.error("Error attempting to toggle full-screen mode:", err);
    }
  };

  // Sync fullscreen state with Esc key presses
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const leaveCall = useCallback(async (notifyParent = true) => {
    try {
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

      // Exit fullscreen if leaving
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(() => {});
      }
    } catch (leaveError) {
      setError(leaveError?.message || 'There was an issue while leaving the call.');
    } finally {
      setRemoteParticipants([]);
      setIsMicEnabled(true);
      setIsCameraEnabled(true);
      setConnectionState('idle');

      if (notifyParent) {
        await onLeave?.();
      }
    }
  }, [onLeave]);

  const playRemoteVideoTrack = useCallback((uid) => {
    const normalizedUid = normalizeUid(uid);
    const videoTrack = remoteVideoTracksRef.current.get(normalizedUid);
    const targetElement = document.getElementById(`remote-player-${normalizedUid}`);

    if (videoTrack && targetElement) {
      videoTrack.play(targetElement);
    }
  }, []);

  const joinCall = useCallback(async (payload) => {
    if (!payload?.appId || !payload?.channelName || !payload?.token) {
      setError('Missing connection details. Please try again.');
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
          }, 100);
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
    if (!joinPayload?.sessionId) return;
    const timeoutId = window.setTimeout(() => joinCall(joinPayload), 0);
    return () => window.clearTimeout(timeoutId);
  }, [joinPayload, joinCall]);

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

  const handleCopyChannel = () => {
    if (joinPayload?.channelName) {
      navigator.clipboard.writeText(joinPayload.channelName);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div 
      ref={containerRef}
      className={`relative flex w-full flex-col overflow-hidden bg-slate-950 shadow-2xl ring-1 ring-white/10 transition-all duration-300 ${isFullscreen ? 'h-screen rounded-none' : 'h-[80vh] min-h-[600px] rounded-3xl'}`}
    >
      
      {/* Top Overlay Header */}
      <header className="absolute inset-x-0 top-0 z-20 flex items-start justify-between bg-gradient-to-b from-black/80 via-black/40 to-transparent p-6 text-white transition-opacity duration-300">
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center rounded-lg bg-teal-500/20 p-2 text-teal-400 backdrop-blur-md">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight shadow-black drop-shadow-md">
                {appointmentDetails?.specialty || 'Secure Consultation'}
              </h2>
              <div className="flex items-center gap-2 text-xs font-medium text-slate-300 shadow-black drop-shadow-md">
                {connectionState === 'joined' && (
                  <span className="flex h-2 w-2 animate-pulse rounded-full bg-emerald-500"></span>
                )}
                <span>{connectionState === 'joined' ? 'Live Encrypted Call' : 'Connecting...'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex flex-col items-end gap-2">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-full bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur-md border border-white/5">
              <Clock size={16} className="text-slate-300" />
              <span>{appointmentDetails?.timeSlot || 'Ongoing'}</span>
            </div>
            
            {/* Fullscreen Toggle */}
            <button 
              onClick={toggleFullscreen}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-slate-300 transition-colors hover:bg-white/20 hover:text-white backdrop-blur-md border border-white/5"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
            </button>
          </div>

          <button 
            onClick={handleCopyChannel}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors mt-1 pr-1"
          >
            ID: {joinPayload?.channelName}
            {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          </button>
        </div>
      </header>

      {/* Main Video Area (Remote) */}
      <main className="absolute inset-0 z-0 bg-slate-900">
        {remoteParticipants.length === 0 ? (
          <div className="flex h-full w-full flex-col items-center justify-center bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-800 to-slate-950">
            <div className="relative mb-8 flex h-32 w-32 items-center justify-center rounded-full bg-slate-800/80 shadow-2xl ring-1 ring-white/10 backdrop-blur-xl">
              <div className="absolute inset-0 animate-ping rounded-full bg-teal-500/20" />
              <Stethoscope size={48} className="text-teal-400/80" />
            </div>
            <h3 className="text-2xl font-bold tracking-tight text-white">Waiting for Practitioner</h3>
            <p className="mt-2 text-slate-400">The consultation will begin when they join the room.</p>
          </div>
        ) : (
          <div className={`grid h-full w-full gap-1 bg-black ${remoteParticipants.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {remoteParticipants.map((uid) => (
              <div key={uid} className="relative h-full w-full">
                <div id={`remote-player-${uid}`} className="h-full w-full object-cover" />
                <div className="absolute bottom-6 left-6 rounded-md bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-md">
                  Practitioner
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Picture-in-Picture (Local Video) */}
      <div className="absolute bottom-28 right-6 z-20 h-48 w-32 overflow-hidden rounded-xl border border-white/20 bg-slate-800 shadow-2xl transition-transform hover:scale-105 sm:h-56 sm:w-40 md:bottom-8 md:right-8">
        <div ref={localVideoRef} className="h-full w-full object-cover" />
        <div className="absolute bottom-2 left-2 flex gap-1">
          {!isMicEnabled && (
            <div className="rounded-full bg-red-500/80 p-1 backdrop-blur-md">
              <MicOff size={12} className="text-white" />
            </div>
          )}
          {!isCameraEnabled && (
            <div className="rounded-full bg-red-500/80 p-1 backdrop-blur-md">
              <CameraOff size={12} className="text-white" />
            </div>
          )}
        </div>
        <div className="absolute top-2 right-2 rounded bg-black/50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
          You
        </div>
      </div>

      {/* Floating Control Dock */}
      <footer className="absolute bottom-8 left-1/2 z-30 -translate-x-1/2">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/50 px-6 py-4 shadow-2xl backdrop-blur-xl transition-all hover:bg-black/60">
          
          <button
            onClick={toggleMic}
            disabled={connectionState !== 'joined'}
            className={`group relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 ${isMicEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
          >
            {isMicEnabled ? <Mic size={22} /> : <MicOff size={22} />}
          </button>

          <button
            onClick={toggleCamera}
            disabled={connectionState !== 'joined'}
            className={`group relative flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 disabled:opacity-50 ${isCameraEnabled ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.5)]'}`}
          >
            {isCameraEnabled ? <Camera size={22} /> : <CameraOff size={22} />}
          </button>

          <div className="mx-2 h-8 w-px bg-white/10" />

          <button
            onClick={() => leaveCall(true)}
            disabled={connectionState !== 'joined' && connectionState !== 'joining'}
            className="group flex h-12 items-center justify-center gap-2 rounded-full bg-red-600 px-6 font-semibold text-white transition-all hover:bg-red-700 hover:shadow-[0_0_20px_rgba(220,38,38,0.4)] disabled:opacity-50"
          >
            {connectionState === 'joining' ? (
              <LoaderCircle size={22} className="animate-spin" />
            ) : (
              <>
                <PhoneOff size={22} />
                <span className="hidden sm:inline-block">End Call</span>
              </>
            )}
          </button>
        </div>
      </footer>

      {/* Error Toast */}
      {error && (
        <div className="absolute left-1/2 top-24 z-50 w-full max-w-sm -translate-x-1/2 rounded-lg border border-red-500/30 bg-red-950/90 p-4 text-center text-sm font-medium text-red-200 shadow-xl backdrop-blur-md">
          {error}
        </div>
      )}
    </div>
  );
};

export default VideoConsultRoom;