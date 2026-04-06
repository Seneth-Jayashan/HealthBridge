import React, { useEffect, useMemo, useState } from 'react';
import { ListChecks, RefreshCw, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getMyTelemedicineSessions,
  getTelemedicineJoinToken,
} from '../../services/telemedicine.service';
import VideoConsultRoom from '../../components/telemedicine/VideoConsultRoom';

const PatientTelehealth = () => {
  const { user } = useAuth();

  const [sessions, setSessions] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [joinPayload, setJoinPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

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
      setError(requestError?.response?.data?.message || 'Unable to load your telehealth sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const joinSelectedSession = async () => {
    if (!selectedSession) {
      setError('Please select a session first.');
      return;
    }

    setJoining(true);
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
      setMessage('Joining secure consultation room...');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to join this session right now.');
    } finally {
      setJoining(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-cyan-50 p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-blue-700">Patient Portal</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">Telehealth Consultation</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">Join your scheduled doctor consultation securely in real time.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">{error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">{message}</div>}

      <div className="grid gap-5 xl:grid-cols-5">
        <div className="space-y-5 xl:col-span-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-slate-900">
                <ListChecks size={18} className="text-blue-600" />
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
                <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-500">No consultations assigned yet.</div>
              ) : (
                sessions.map((session) => (
                  <button
                    key={session._id}
                    type="button"
                    onClick={() => setSelectedSessionId(session._id)}
                    className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                      selectedSessionId === session._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <p className="text-sm font-bold text-slate-900">{session.channelName}</p>
                    <p className="mt-1 text-xs font-medium text-slate-600">Status: {session.status}</p>
                    <p className="mt-1 text-xs font-medium text-slate-500">
                      {session.scheduledAt ? new Date(session.scheduledAt).toLocaleString() : 'No scheduled time'}
                    </p>
                  </button>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={joinSelectedSession}
              disabled={joining || !selectedSession}
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50"
            >
              <Video size={16} />
              <span>{joining ? 'Joining...' : 'Join Selected Session'}</span>
            </button>
          </div>
        </div>

        <div className="xl:col-span-3">
          <VideoConsultRoom
            joinPayload={joinPayload}
            displayName={user?.name || 'Patient'}
            onLeave={() => setJoinPayload(null)}
          />
        </div>
      </div>
    </section>
  );
};

export default PatientTelehealth;
