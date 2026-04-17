import React, { useEffect, useMemo, useState } from 'react';
import { 
  CalendarDays, Loader2, RefreshCcw, Video, 
  AlertCircle, CheckCircle2, Stethoscope, ChevronRight,
  Clock, User, ShieldCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  getMyTelemedicineSessions,
  getTelemedicineJoinToken,
  getPatientOnlineAppointments,
} from '../../services/telemedicine.service';
import { getDoctorById} from '../../services/user.service';
import { getDoctorByIdForPatient } from'../../services/patient.service';
import VideoConsultRoom from '../../components/telemedicine/VideoConsultRoom';
import Feedback from '../../components/doctor/Feedback'; 

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

  // --- NEW FEEDBACK MODAL STATE ---
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [feedbackDoctorId, setFeedbackDoctorId] = useState('');
  const [feedbackDoctorName, setFeedbackDoctorName] = useState('');

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
      setError(requestError?.response?.data?.message || 'Unable to load your appointments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSessions();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!joinPayload?.sessionId) return;
    const terminalStatuses = new Set(['ended', 'completed', 'cancelled']);

    const syncSessionState = async () => {
      try {
        const data = await getMyTelemedicineSessions();
        const safeList = Array.isArray(data) ? data : [];
        const liveSession = safeList.find((session) => session._id === joinPayload.sessionId);
        const status = String(liveSession?.status || '').toLowerCase();

        // If the backend marks the session as ended while we are in it
        if (!liveSession || terminalStatuses.has(status)) {
          triggerCallEnd();
        }
      } catch {
        // Silent catch for transient polling failures
      }
    };

    const intervalId = window.setInterval(syncSessionState, 5000);
    
    // STOP HERE. Do not add code after the return statement.
    return () => window.clearInterval(intervalId); 
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [joinPayload?.sessionId]);

  const joinSelectedSession = async () => {
    if (!selectedSession) {
      setError('Please select an appointment first.');
      return;
    }
    setJoining(true);
    setError('');

    try {
      const tokenData = await getTelemedicineJoinToken(selectedSession._id);
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
      setMessage('Secure connection established.');
    } catch (requestError) {
      setError(requestError?.response?.data?.message || 'Unable to join the room right now.');
    } finally {
      setJoining(false);
    }
  };

  // --- check selectedSession id from sessions to get All details of the session
  const getSessionDetails = (selectedSessionId) => {
    const session = sessions.find(s => s._id === selectedSessionId);
    if (!session) return null;
    const appointment = appointments.find(a => a._id === session.appointmentId);
    return {
      ...session,
      appointmentDetails: appointment || {},
    };
  };

  const fetchCompleteDoctorDetails = async (selectedSessionId) => {
      try {
          const docId = getSessionDetails(selectedSessionId)?.doctorId || null;
          
          if (!docId) {
              return { docId: null, doctorData: null, docName: 'Your Doctor' };
          }

          const doctor = await getDoctorByIdForPatient(docId);
          const actualDoctorData = doctor?.data || doctor;

          let docName = 'Your Doctor';
          if (actualDoctorData?.userId) {
              const nameResponse = await getDoctorById(actualDoctorData.userId);
              docName = nameResponse?.name || nameResponse?.data?.name || 'Your Doctor';
          }

          return {
              docId,
              doctorData: actualDoctorData,
              docName
          };

      } catch (error) {
          console.error("Error fetching complete doctor details:", error);
          return { docId: null, doctorData: null, docName: 'Your Doctor' };
      }
  };

  // --- NEW HANDLER FOR ENDING THE CALL ---
  // --- CORRECTED HANDLER FOR ENDING THE CALL ---
  const triggerCallEnd = async () => {
    const { docId, docName } = await fetchCompleteDoctorDetails(selectedSessionId);

    if (docId) {
      setFeedbackDoctorId(docId);
      setFeedbackDoctorName(docName);
    }

    // 2. Clear the video room state
    setJoinPayload(null);
    setCurrentAppointment(null);
    setSelectedSessionId('');
    setMessage('The consultation has ended.');
    
    // 3. Refresh the session list
    await loadSessions();

    // 4. Open the Feedback Modal using the local variable we saved in step 1!
    if (docId) {
      setIsFeedbackOpen(true);
    }
  };

  const getStatusDisplay = (status) => {
    const s = String(status).toLowerCase();
    if (s.includes('active') || s.includes('ongoing')) return { text: 'Live Now', color: 'bg-emerald-500 text-white animate-pulse' };
    if (s.includes('waiting')) return { text: 'Waiting Room', color: 'bg-amber-100 text-amber-700' };
    if (s.includes('ended') || s.includes('completed')) return { text: 'Completed', color: 'bg-slate-100 text-slate-600' };
    return { text: status, color: 'bg-blue-100 text-blue-700' };
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-50 to-blue-50/30 py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
        {/* Page Header */}
        <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              Welcome, {user?.name?.split(' ')[0] || 'Patient'}
            </h1>
            <p className="mt-1 text-base text-slate-500">
              Manage your upcoming online consultations here.
            </p>
          </div>
          <button
            onClick={loadSessions}
            disabled={loading}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:shadow disabled:opacity-50"
          >
            <RefreshCcw size={16} className={loading ? "animate-spin text-blue-600" : "text-slate-400"} />
            Refresh
          </button>
        </header>

        {/* Global Notifications */}
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

        {/* Main Interface */}
        <div className="grid gap-8 lg:grid-cols-12">
          
          {/* Left Column: Appointments List */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            <h2 className="text-lg font-bold text-slate-800 px-1">Your Appointments</h2>

            <div className="flex flex-col gap-3">
              {loading && sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white/50 py-16 text-slate-400">
                  <Loader2 size={32} className="animate-spin text-blue-500 mb-4" />
                  <p className="font-medium">Finding your appointments...</p>
                </div>
              ) : sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-slate-200 bg-white py-16 text-center shadow-sm">
                  <div className="rounded-full bg-blue-50 p-4 mb-4">
                    <CalendarDays size={32} className="text-blue-500" />
                  </div>
                  <p className="text-base font-bold text-slate-700">No appointments</p>
                  <p className="mt-1 text-sm text-slate-500 px-6">You don't have any scheduled video consultations at the moment.</p>
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
                          ? 'border-blue-500 bg-white shadow-xl shadow-blue-500/10'
                          : 'border-transparent bg-white shadow-sm hover:border-slate-200 hover:shadow-md'
                      }`}
                    >
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition-colors ${isSelected ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                            <Video size={24} />
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
                      
                      {/* Selection Indicator Strip */}
                      <div className={`h-1.5 w-full transition-colors ${isSelected ? 'bg-blue-500' : 'bg-transparent group-hover:bg-slate-100'}`} />
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Dynamic Stage (Lobby or Video Room) */}
          <div className="lg:col-span-7 xl:col-span-8 relative">
            
            {!selectedSession ? (
              /* Empty State Stage */
              <div className="hidden lg:flex h-full min-h-[500px] flex-col items-center justify-center rounded-[2.5rem] border border-slate-200/60 bg-white/50 text-slate-400">
                <Video size={64} className="mb-6 opacity-20" />
                <p className="text-lg font-medium text-slate-500">Select an appointment to view details</p>
              </div>
            ) : joinPayload ? (
              /* Active Video Room Stage */
              <div className="animate-in zoom-in-95 fade-in duration-500">
                <VideoConsultRoom
                  joinPayload={joinPayload}
                  displayName={user?.name || 'Patient'}
                  appointmentDetails={currentAppointment}
                  // --- TRIGGER END LOGIC WHEN COMPONENT LEAVES ---
                  onLeave={triggerCallEnd}
                />
              </div>
            ) : (
              /* Pre-Call Lobby Stage */
              <div className="flex min-h-[500px] flex-col overflow-hidden rounded-[2.5rem] bg-white shadow-xl shadow-slate-200/40 ring-1 ring-slate-200 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Lobby Header Art */}
                <div className="relative h-48 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white flex flex-col justify-end">
                  <div className="absolute top-6 right-6 rounded-2xl bg-white/20 p-3 backdrop-blur-md">
                    <ShieldCheck size={32} className="text-white" />
                  </div>
                  <span className="mb-2 w-fit rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                    Pre-Call Lobby
                  </span>
                  <h2 className="text-3xl font-extrabold tracking-tight">
                    {selectedSession.channelName}
                  </h2>
                </div>

                {/* Lobby Details */}
                <div className="flex-1 p-8">
                  <div className="grid gap-6 sm:grid-cols-2 mb-10">
                    <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-600">
                        <Stethoscope size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Reason</p>
                        <p className="font-semibold text-slate-800 line-clamp-1">
                          {appointmentsById[selectedSession.appointmentId]?.reason || 'General'}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 ring-1 ring-slate-100">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                        <User size={24} />
                      </div>
                      <div>
                        <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Patient</p>
                        <p className="font-semibold text-slate-800 line-clamp-1">
                          {user?.name || 'You'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Big Action Button */}
                  <div className="flex flex-col items-center justify-center pt-4 border-t border-slate-100">
                    <button
                      onClick={joinSelectedSession}
                      disabled={joining}
                      className="group relative flex w-full sm:w-auto items-center justify-center gap-3 overflow-hidden rounded-full bg-blue-600 px-10 py-5 text-lg font-bold text-white shadow-xl shadow-blue-600/30 transition-all hover:-translate-y-1 hover:bg-blue-500 hover:shadow-2xl hover:shadow-blue-500/40 disabled:pointer-events-none disabled:opacity-70"
                    >
                      {joining ? (
                        <>
                          <Loader2 size={24} className="animate-spin" />
                          <span>Preparing Secure Room...</span>
                        </>
                      ) : (
                        <>
                          <Video size={24} />
                          <span>Join Video Consultation</span>
                          <ChevronRight size={24} className="transition-transform group-hover:translate-x-2" />
                        </>
                      )}
                    </button>
                    <p className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-500">
                      <ShieldCheck size={16} className="text-emerald-500" />
                      End-to-end encrypted call
                    </p>
                  </div>
                </div>

              </div>
            )}
          </div>

        </div>
      </div>

      {/* --- RENDER FEEDBACK MODAL --- */}
      <Feedback 
        isOpen={isFeedbackOpen}
        onClose={() => setIsFeedbackOpen(false)}
        doctorId={feedbackDoctorId}
        doctorName={feedbackDoctorName}
        // onSuccess={loadSessions} // Optional: if you want to refresh anything specific after a review
      />
    </div>
  );
};

export default PatientTelehealth;