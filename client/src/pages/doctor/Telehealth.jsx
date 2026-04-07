import React, { useEffect, useMemo, useState } from 'react';
import { CalendarClock, ListChecks, LoaderCircle, RefreshCw, Video, Plus } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  endTelemedicineSession,
  getMyTelemedicineSessions,
  getTelemedicineJoinToken,
  startTelemedicineSession,
} from '../../services/telemedicine.service';
import VideoConsultRoom from '../../components/telemedicine/VideoConsultRoom';

const DoctorTelehealth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [joinPayload, setJoinPayload] = useState(null);

  const selectedSession = useMemo(
    () => sessions.find((session) => session._id === selectedSessionId) || null,
    [sessions, selectedSessionId],
  );

  const loadSessions = async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getMyTelemedicineSessions();
      const safeList = Array.isArray(data) ? data : [];
      setSessions(safeList);

      if (safeList.length === 0) {
        setSelectedSessionId('');
      } else if (!safeList.some((session) => session._id === selectedSessionId)) {
        setSelectedSessionId(safeList[0]._id);
      }
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to load telemedicine sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    
    // Auto-select session if redirected from CreateSession
    if (location.state?.sessionId) {
      setSelectedSessionId(location.state.sessionId);
    }
  }, []);

  const handleStartSession = async () => {
    if (!selectedSession) return;

    setSubmitting(true);
    setError('');

    try {
      await startTelemedicineSession(selectedSession._id);
      setMessage('Session is now marked as active.');
      await loadSessions();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to start this session.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEndSession = async () => {
    if (!selectedSession) return;

    setSubmitting(true);
    setError('');

    try {
      await endTelemedicineSession(selectedSession._id);
      setJoinPayload(null);
      setMessage('Session ended successfully.');
      await loadSessions();
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to end this session.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleJoinSession = async () => {
    if (!selectedSession) return;

    setSubmitting(true);
    setError('');

    try {
      const tokenData = await getTelemedicineJoinToken(selectedSession._id);

      setJoinPayload({
        sessionId: selectedSession._id,
        appId: tokenData.appId,
        channelName: tokenData.channelName,
        token: tokenData.token,
        uid: tokenData.uid,
        account: tokenData.account,
      });
      setMessage('Joining consultation room...');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to join this session.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedSessionTime = selectedSession?.scheduledAt
    ? new Date(selectedSession.scheduledAt).toLocaleString()
    : 'Not scheduled';

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-teal-700">Doctor Console</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Live Telehealth</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">Create sessions, activate consultations, and join securely with Agora.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>}

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="space-y-5 xl:col-span-2">
          {/* Create Session Button */}
          <button
            onClick={() => navigate('/doctor/create-session')}
            className="w-full rounded-2xl border border-teal-300 bg-gradient-to-r from-teal-50 to-cyan-50 p-6 shadow-sm hover:shadow-md hover:border-teal-400 transition-all duration-200 flex flex-col items-center justify-center gap-3 text-center"
          >
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-teal-600 text-white">
              <Plus size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-teal-900">Create New Session</h3>
              <p className="text-sm text-teal-700 mt-1">Start a new consultation room</p>
            </div>
          </button>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-900">
                <ListChecks size={18} className="text-teal-600" />
                <h2 className="text-lg font-black">My Sessions</h2>
              </div>
              <button
                type="button"
                onClick={loadSessions}
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600"
              >
                <RefreshCw size={14} />
                <span>Refresh</span>
              </button>
            </div>

            <div className="mt-4 space-y-2">
              {loading ? (
                <div className="text-sm font-medium text-slate-500">Loading sessions...</div>
              ) : sessions.length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-500">No sessions yet.</div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session._id}
                    type="button"
                    onClick={() => setSelectedSessionId(session._id)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                      selectedSessionId === session._id
                        ? 'border-teal-500 bg-teal-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-900">{session.channelName}</p>
                    <p className="mt-1 text-xs font-medium text-slate-600">Status: {session.status}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">Patient: {String(session.patientId)}</p>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-5 xl:col-span-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-700">
                  <Video size={14} />
                  <span>Selected Session</span>
                </div>
                <h3 className="mt-2 text-lg font-black text-slate-900">{selectedSession?.channelName || 'Choose a session'}</h3>
                <p className="mt-1 inline-flex items-center gap-1 text-sm font-medium text-slate-600">
                  <CalendarClock size={14} />
                  <span>{selectedSessionTime}</span>
                </p>
              </div>

              <div className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                {selectedSession?.status || 'idle'}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleStartSession}
                disabled={!selectedSession || submitting}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Start Session
              </button>
              <button
                type="button"
                onClick={handleJoinSession}
                disabled={!selectedSession || submitting}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                Join Session
              </button>
              <button
                type="button"
                onClick={handleEndSession}
                disabled={!selectedSession || submitting}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
              >
                End Session
              </button>
            </div>
          </div>

          <VideoConsultRoom
            joinPayload={joinPayload}
            displayName={user?.name || 'Doctor'}
            onLeave={() => setJoinPayload(null)}
          />
        </div>
      </div>
    </section>
  );
};

export default DoctorTelehealth;
