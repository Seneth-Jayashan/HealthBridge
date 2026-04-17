import React, { useEffect, useMemo, useState } from 'react';
import { 
  CalendarDays, Loader2, RefreshCcw, Video, 
  AlertCircle, CheckCircle2, Stethoscope, ChevronRight,
  User, ShieldCheck, Play 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  getMyTelemedicineSessions,
  getTelemedicineJoinToken,
  startTelemedicineSession,
  endTelemedicineSession,
  getDoctorOnlineAppointments,
} from '../../services/telemedicine.service';
import VideoConsultRoom from '../../components/telemedicine/VideoConsultRoom';
import { getPatientByIdForDoctor } from '../../services/doctor.service';

const DoctorTelehealth = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
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
    if (location.state?.sessionId) {
      setSelectedSessionId(location.state.sessionId);
    }
  }, []);

  useEffect(() => {
    if (location.state?.autoJoin && selectedSessionId && joinPayload === null) {
      const autoJoinSession = async () => {
        try {
          await startTelemedicineSession(selectedSessionId);
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
      window.history.replaceState({ ...location.state, autoJoin: false }, '');
    }
  }, [selectedSessionId, location.state?.autoJoin, joinPayload]);

  const handleStartSession = async () => {
    if (!selectedSession) return;
    setSubmitting(true);
    setError('');

    try {
      await startTelemedicineSession(selectedSession._id);
      const tokenData = await getTelemedicineJoinToken(selectedSession._id);

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
      setMessage('Session started. Joining consultation room...');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to start and join this session.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLeaveRoom = async () => {
    const activeSessionId = joinPayload?.sessionId;
    if (!activeSessionId) return;

    const patientId = selectedSession.patientId;
    const patient = await getPatientByIdForDoctor(patientId);
    console.log('Patient details for post-session action:', patient);

    try {
      await endTelemedicineSession(activeSessionId);
      setMessage('Session ended successfully.');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'You left the call, but ending session failed.');
    } finally {
      setJoinPayload(null);
      setCurrentAppointment(null);
      if (patientId) {
        navigate(`/doctor/prescriptions/new?patientId=${patient._id}`);
        return;
      }
      await loadSessions();
    }
  };

  const getStatusDisplay = (status) => {
    const s = String(status).toLowerCase();
    if (s.includes('active') || s.includes('ongoing')) return { text: 'Live Now', color: 'bg-emerald-500 text-white animate-pulse' };
    if (s.includes('waiting') || s.includes('idle')) return { text: 'Waiting', color: 'bg-amber-100 text-amber-700' };
    if (s.includes('ended') || s.includes('completed')) return { text: 'Completed', color: 'bg-slate-100 text-slate-600' };
    return { text: status, color: 'bg-teal-100 text-teal-700' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-teal-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Provider Dashboard
            </h1>
            <p className="mt-1 text-base text-slate-500">
              Manage and conduct your online patient consultations.
            </p>
          </div>
          <button
            onClick={loadSessions}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow disabled:opacity-50"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin text-teal-600" : "text-slate-400"} />
            Refresh List
          </button>
        </header>

        <div className="space-y-3">
          {error && (
            <div className="flex items-center gap-3 rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-800 ring-1 ring-red-200">
              <AlertCircle size={20} className="text-red-500 shrink-0" />
              <p>{error}</p>
            </div>
          )}
          {message && !joinPayload && (
            <div className="flex items-center gap-3 rounded-2xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-800 ring-1 ring-emerald-200">
              <CheckCircle2 size={20} className="text-emerald-500 shrink-0" />
              <p>{message}</p>
            </div>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-12">
          
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-800 px-1">Active Sessions</h2>

            <div className="flex flex-col gap-3">
              {loading && sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 py-16 text-slate-400">
                  <Loader2 size={32} className="animate-spin text-teal-500 mb-4" />
                  <p className="font-medium">Loading patient sessions...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
                  <div className="rounded-full bg-teal-50 p-4 mb-4">
                    <CalendarDays size={32} className="text-teal-500" />
                  </div>
                  <p className="text-base font-bold text-slate-700">No sessions scheduled</p>
                  <p className="mt-1 text-sm text-slate-500 px-6">You don't have any pending video consultations.</p>
                </div>
              ) : (
                sessions.map((session) => {
                  const appointment = appointmentsById[session.appointmentId];
                  const sessionTopic = appointment?.reason || session?.metadata?.reason || 'General Consultation';
                  const isSelected = selectedSessionId === session._id;
                  const status = getStatusDisplay(session.status);

                  return (
                    <button
                      key={session._id}
                      onClick={() => setSelectedSessionId(session._id)}
                      className={`group relative flex w-full flex-col overflow-hidden rounded-3xl border-2 text-left transition-all duration-300 ${
                        isSelected
                          ? 'border-teal-500 bg-white shadow-xl shadow-teal-500/10'
                          : 'border-transparent bg-white shadow-sm hover:border-slate-200 hover:shadow-md'
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors ${isSelected ? 'bg-teal-100 text-teal-600' : 'bg-slate-100 text-slate-500'}`}>
                            <User size={24} />
                          </div>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tracking-wide ${status.color}`}>
                            {status.text}
                          </span>
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-900 mb-1">{session.channelName}</h3>
                        <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
                          <Stethoscope size={16} />
                          <span className="line-clamp-1">{sessionTopic}</span>
                        </div>
                      </div>
                      
                      <div className={`h-1.5 w-full transition-colors ${isSelected ? 'bg-teal-500' : 'bg-transparent group-hover:bg-slate-100'}`} />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          <div className="lg:col-span-7 xl:col-span-8 relative">
            
            {!selectedSession ? (
              <div className="hidden lg:flex h-full min-h-[500px] flex-col items-center justify-center rounded-[2.5rem] border border-slate-200/60 bg-white/50 text-slate-400">
                <Video size={64} className="mb-6 opacity-20" />
                <p className="text-lg font-medium text-slate-500">Select a patient session from the list</p>
              </div>
            ) : joinPayload ? (
              <div className="animate-in zoom-in-95 fade-in duration-500">
                <VideoConsultRoom
                  joinPayload={joinPayload}
                  displayName={user?.name || 'Doctor'}
                  appointmentDetails={currentAppointment}
                  onLeave={handleLeaveRoom}
                />
              </div>
            ) : (
              <div className="flex min-h-[500px] flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/40 ring-1 ring-slate-200 animate-in fade-in slide-in-from-bottom-4">
                
                <div className="relative h-48 bg-gradient-to-br from-teal-600 to-emerald-700 p-8 text-white flex flex-col justify-end">
                  <div className="absolute top-6 right-6 rounded-2xl bg-white/20 p-3 backdrop-blur-md">
                    <ShieldCheck size={32} className="text-white" />
                  </div>
                  <span className="mb-2 w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    Session Ready
                  </span>
                  <h2 className="text-3xl font-extrabold tracking-tight">
                    {selectedSession.channelName}
                  </h2>
                </div>

                <div className="flex-1 p-8">
                  <div className="grid gap-6 sm:grid-cols-2 mb-10">
                    <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                        <Stethoscope size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Consultation Reason</p>
                        <p className="font-semibold text-slate-800 line-clamp-1">
                          {appointmentsById[selectedSession.appointmentId]?.reason || selectedSession?.metadata?.reason || 'General Follow-up'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Room ID / Patient Ref</p>
                        <p className="font-semibold text-slate-800 line-clamp-1">
                          {selectedSession.channelName}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center pt-4 border-t border-slate-100">
                    <button
                      onClick={handleStartSession}
                      disabled={submitting}
                      className="group relative flex w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-full bg-teal-600 px-10 py-5 text-lg font-bold text-white shadow-xl shadow-teal-600/30 transition-all hover:-translate-y-1 hover:bg-teal-500 hover:shadow-2xl hover:shadow-teal-500/40 disabled:pointer-events-none disabled:opacity-70"
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={24} className="animate-spin" />
                          <span>Initializing Session...</span>
                        </>
                      ) : (
                        <>
                          <Play size={24} className="fill-white" />
                          <span>Start & Join Consultation</span>
                          <ChevronRight size={24} className="transition-transform group-hover:translate-x-2" />
                        </>
                      )}
                    </button>
                    <p className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <ShieldCheck size={16} className="text-emerald-500" />
                      HIPAA Compliant Encrypted Room
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default DoctorTelehealth;