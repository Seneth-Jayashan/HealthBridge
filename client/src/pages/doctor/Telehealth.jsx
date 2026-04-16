import React, { useEffect, useMemo, useState } from 'react';
import { ListChecks, LoaderCircle, RefreshCw, Video } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  endTelemedicineSession,
  getMyTelemedicineSessions,
  getTelemedicineJoinToken,
  startTelemedicineSession,
  getDoctorOnlineAppointments,
} from '../../services/telemedicine.service';
import VideoConsultRoom from '../../components/telemedicine/VideoConsultRoom';
import DoctorAppointmentList from '../../components/telemedicine/DoctorAppointmentList';

const DoctorTelehealth = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState('appointments'); // 'appointments' or 'sessions'
  const [sessions, setSessions] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [selectedSessionId, setSelectedSessionId] = useState('');
  const [joinPayload, setJoinPayload] = useState(null);
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

  const handleStartSessionFromAppointment = async (sessionId) => {
    // Load sessions to ensure we have the latest data
    await loadSessions();
    
    // Set the selected session
    setSelectedSessionId(sessionId);
    
    // Switch to sessions tab
    setActiveTab('sessions');
  };

  const loadSessions = async () => {
    setLoading(true);
    setError('');

    try {
      const [data, appts] = await Promise.all([
        getMyTelemedicineSessions(),
        getDoctorOnlineAppointments()
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
      setError(requestError?.response?.data?.message || 'Unable to load telemedicine sessions.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
    
    // Auto-select session if redirected from DoctorAppointmentList
    if (location.state?.sessionId) {
      setSelectedSessionId(location.state.sessionId);
      // Auto-join if coming from Start Call button
      if (location.state.autoJoin) {
        setActiveTab('sessions');
      }
    }
  }, []);

  useEffect(() => {
    // Auto-join session when redirected from appointment with autoJoin flag
    if (location.state?.autoJoin && selectedSessionId && joinPayload === null) {
      const autoJoinSession = async () => {
        try {
          // First start the session
          await startTelemedicineSession(selectedSessionId);
          
          // Then get the token and join
          const tokenData = await getTelemedicineJoinToken(selectedSessionId);
          setJoinPayload({
            sessionId: selectedSessionId,
            appId: tokenData.appId,
            channelName: tokenData.channelName,
            token: tokenData.token,
            uid: tokenData.uid,
            account: tokenData.account,
          });
          setMessage('Joining consultation room...');
        } catch (requestError) {
          setError(requestError?.response?.data?.message || 'Unable to join this session.');
        }
      };
      
      autoJoinSession();
      
      // Clear the autoJoin flag to prevent repeated calls
      window.history.replaceState({ ...location.state, autoJoin: false }, '');
    }
  }, [selectedSessionId, location.state?.autoJoin, joinPayload]);

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

      // Find the associated appointment
      let appointment = null;
      if (location.state?.appointmentId) {
        appointment = appointments.find(a => a._id === location.state.appointmentId);
      } else if (selectedSession.appointmentId) {
        appointment = appointments.find(a => a._id === selectedSession.appointmentId);
      }

      setJoinPayload({
        sessionId: selectedSession._id,
        appId: tokenData.appId,
        channelName: tokenData.channelName,
        token: tokenData.token,
        uid: tokenData.uid,
        account: tokenData.account,
      });
      
      setCurrentAppointment(appointment);
      setMessage('Joining consultation room...');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to join this session.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50 p-6 shadow-sm">
        <p className="text-xs font-black uppercase tracking-wider text-teal-700">✅ Doctor Management</p>
        <h1 className="mt-2 text-3xl font-black text-slate-900">📞 Telehealth Consultations</h1>
        <p className="mt-2 text-sm font-medium text-slate-600">Confirm appointments, start video sessions, and manage online patient consultations seamlessly.</p>
      </div>

      {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">❌ {error}</div>}
      {message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">✅ {message}</div>}

      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-3 font-bold text-sm transition-colors ${
            activeTab === 'appointments'
              ? 'border-b-2 border-teal-600 text-teal-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          📅 Online Appointments
        </button>
        <button
          onClick={() => setActiveTab('sessions')}
          className={`px-4 py-3 font-bold text-sm transition-colors ${
            activeTab === 'sessions'
              ? 'border-b-2 border-teal-600 text-teal-600'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          🎥 Video Sessions
        </button>
      </div>

      {/* Appointments Tab */}
      {activeTab === 'appointments' && <DoctorAppointmentList onStartSession={handleStartSessionFromAppointment} />}

      {/* Sessions Tab */}
      {activeTab === 'sessions' && (
        <div className="grid gap-5 xl:grid-cols-5">
          <div className="space-y-5 xl:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-5 hover:border-white/20 transition-all duration-200">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-slate-900">
                  <ListChecks size={18} className="text-teal-600" />
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
                      const patientName = appointment?.patientName || String(session.patientId).slice(0, 8);

                      return (
                    <button
                      key={session._id}
                      type="button"
                      onClick={() => setSelectedSessionId(session._id)}
                      className={`w-full rounded-lg border px-3 py-3 text-left transition ${
                        selectedSessionId === session._id
                          ? 'border-teal-500 bg-teal-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:bg-slate-50'
                      }`}
                    >
                      <p className="text-sm font-bold text-slate-900">{session.channelName}</p>
                      <p className="mt-1 text-xs font-medium text-slate-600">🔄 Status: {session.status}</p>
                      <p className="mt-1 text-xs font-medium text-slate-600">🩺 Session Topic: {sessionTopic}</p>
                      <p className="mt-1 text-xs font-medium text-slate-500">👤 Patient: {patientName}</p>
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
                  <div className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-teal-700 border border-teal-200">
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
                  onClick={handleStartSession}
                  disabled={!selectedSession || submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-700 px-4 py-2 text-sm font-bold text-white hover:shadow-lg hover:shadow-emerald-500/30 disabled:opacity-50 transition-all"
                >
                  {submitting ? <LoaderCircle size={16} className="animate-spin" /> : '▶️'}
                  Start Session
                </button>
                <button
                  type="button"
                  onClick={handleJoinSession}
                  disabled={!selectedSession || submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-teal-600 to-teal-700 px-4 py-2 text-sm font-bold text-white hover:shadow-lg hover:shadow-teal-500/30 disabled:opacity-50 transition-all"
                >
                  {submitting ? <LoaderCircle size={16} className="animate-spin" /> : '📹'}
                  Join Video Call
                </button>
                <button
                  type="button"
                  onClick={handleEndSession}
                  disabled={!selectedSession || submitting}
                  className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 px-4 py-2 text-sm font-bold text-white hover:shadow-lg hover:shadow-red-500/30 disabled:opacity-50 transition-all"
                >
                  {submitting ? <LoaderCircle size={16} className="animate-spin" /> : '⏹️'}
                  End Session
                </button>
              </div>
            </div>

            <VideoConsultRoom
              joinPayload={joinPayload}
              displayName={user?.name || 'Doctor'}
              appointmentDetails={currentAppointment}
              onLeave={() => {
                setJoinPayload(null);
                setCurrentAppointment(null);
              }}
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default DoctorTelehealth;
