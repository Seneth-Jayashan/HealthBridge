import React, { useEffect, useMemo, useState } from 'react';
import { ListChecks, LoaderCircle, RefreshCw, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getMyTelemedicineSessions,
  getTelemedicineJoinToken,
  getPatientOnlineAppointments,
} from '../../services/telemedicine.service';
import VideoConsultRoom from '../../components/telemedicine/VideoConsultRoom';

const PatientTelehealth = () => {
  const { user } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [joinPayload, setJoinPayload] = useState(null);
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [currentAppointment, setCurrentAppointment] = useState(null);

  const selectedSession = useMemo(
    () => sessions.find((session) => session._id === selectedSessionId) || null,
    [sessions, selectedSessionId],
  );

  const appointmentsById = useMemo(() => {
    return appointments.reduce((acc, appointment) => {
      if (appointment?._id) {
        acc[appointment._id] = appointment;
      }
      return acc;
    }, {});
  }, [appointments]);

  const loadSessions = async () => {
    setLoading(true);
    setError('');

    try {
      const [data, appts] = await Promise.all([
        getMyTelemedicineSessions(),
        getPatientOnlineAppointments()
      ]);
      const safeList = Array.isArray(data) ? data : [];
      setSessions(safeList);
      setAppointments(Array.isArray(appts) ? appts : []);

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

      // Find the associated appointment
      const appointment = appointments.find(a => a._id === selectedSession.appointmentId);

      setJoinPayload({
        sessionId: selectedSession._id,
        appId: tokenData.appId,
        channelName: tokenData.channelName,
        token: tokenData.token,
        uid: tokenData.uid,
        account: tokenData.account,
      });
      
      setCurrentAppointment(appointment);
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
        <p className="text-xs font-black uppercase tracking-wider text-blue-700">✅ Patient Portal</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">📞 Telehealth Hub</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">Manage online appointments, review session details, and join secure video consultations with confidence.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">❌ {error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">✅ {message}</div>}

      <div className="grid gap-5 xl:grid-cols-5">
          <div className="space-y-5 xl:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-5 hover:border-white/20 transition-all duration-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-900">
                  <ListChecks size={18} className="text-blue-600" />
                  <h2 className="text-lg font-black">📋 Active Sessions</h2>
                </div>
                <button
                  type="button"
                  onClick={loadSessions}
                  className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  <RefreshCw size={14} />
                  <span>Refresh</span>
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {loading ? (
                  <div className="text-sm font-medium text-slate-500">Loading sessions...</div>
                ) : sessions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 p-4 text-sm font-medium text-slate-500">No active sessions yet.</div>
                ) : (
                  sessions.map((session) => (
                    (() => {
                      const appointment = appointmentsById[session.appointmentId];
                      const sessionTopic = appointment?.reason || session?.metadata?.reason || 'General consultation';

                      return (
                    <button
                      key={session._id}
                      type="button"
                      onClick={() => setSelectedSessionId(session._id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                        selectedSessionId === session._id
                          ? 'border-blue-500 bg-blue-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900">{session.channelName}</p>
                      <p className="mt-1 text-xs font-medium text-slate-600">🔄 Status: {session.status}</p>
                      <div className="mt-2 rounded-md border border-blue-200 bg-blue-50 px-2.5 py-2">
                        <p className="text-[10px] font-black uppercase tracking-wider text-blue-700">Session Topic</p>
                        <p className="mt-0.5 text-sm font-extrabold leading-snug text-blue-900">{sessionTopic}</p>
                      </div>
                    </button>
                      );
                    })()
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="space-y-5 xl:col-span-3">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-5 hover:border-white/20 transition-all duration-200">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-blue-700 border border-blue-200">
                    <Video size={14} />
                    <span>Session Details</span>
                  </div>
                  <h3 className="mt-2 text-lg font-black text-slate-900">{selectedSession?.channelName || '📞 Select a session'}</h3>
                </div>

                <div className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 font-bold text-xs text-slate-700 border border-slate-200">
                  {selectedSession?.status || '⏱️ idle'}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={joinSelectedSession}
                  disabled={joining || !selectedSession}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-bold text-white hover:shadow-lg hover:shadow-blue-500/30 disabled:opacity-50 transition-all"
                >
                  {joining ? <LoaderCircle size={16} className="animate-spin" /> : '📹'}
                  Join Video Call
                </button>
              </div>
            </div>

            {joinPayload && (
              <VideoConsultRoom
                joinPayload={joinPayload}
                displayName={user?.name || 'Patient'}
                appointmentDetails={currentAppointment}
                onLeave={() => {
                  setJoinPayload(null);
                  setCurrentAppointment(null);
                }}
              />
            )}
          </div>
        </div>
    </section>
  );
};

export default PatientTelehealth;
