import React, { useEffect, useState } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle, XCircle, Loader, Phone } from 'lucide-react';
import { getMyOnlineAppointmentsRequest } from '../../services/appointment.service';
import { getOnlineAppointmentsWithSessions, getTelemedicineJoinToken } from '../../services/telemedicine.service';
import VideoConsultRoom from './VideoConsultRoom';

const PatientAppointmentList = () => {
  const [appointments, setAppointments] = useState([]);
  const [sessions, setSessions] = useState({});
  const [loading, setLoading] = useState(false);
  const [joining, setJoining] = useState(null);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [joinPayload, setJoinPayload] = useState(null);
  const [currentAppointment, setCurrentAppointment] = useState(null);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [appts, sess] = await Promise.all([
        getMyOnlineAppointmentsRequest(),
        getOnlineAppointmentsWithSessions()
      ]);
      
      setAppointments(Array.isArray(appts) ? appts : []);
      
      // Create a map of sessions by appointmentId
      const sessionMap = {};
      if (Array.isArray(sess)) {
        sess.forEach(s => {
          if (s.appointmentId) {
            sessionMap[s.appointmentId] = s;
          }
        });
      }
      setSessions(sessionMap);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
    // Refresh every 30 seconds
    const interval = setInterval(loadAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleJoinSession = async (appointmentId) => {
    const appointment = appointments.find(a => a._id === appointmentId);
    const session = sessions[appointmentId];
    if (!session) {
      setError('Video session not found');
      return;
    }

    setJoining(appointmentId);
    setError('');
    
    try {
      const tokenData = await getTelemedicineJoinToken(session._id);
      setJoinPayload({
        sessionId: session._id,
        appId: tokenData.appId,
        channelName: tokenData.channelName,
        token: tokenData.token,
        uid: tokenData.uid,
        account: tokenData.account,
      });
      setCurrentAppointment(appointment);
      setMessage('Joining consultation room...');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to join session');
    } finally {
      setJoining(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: AlertCircle, color: 'amber', text: '⏳ Pending Confirmation' },
      confirmed: { icon: CheckCircle, color: 'emerald', text: '✅ Confirmed' },
      completed: { icon: CheckCircle, color: 'blue', text: '✓ Completed' },
      rejected: { icon: XCircle, color: 'red', text: '❌ Rejected' },
      cancelled: { icon: XCircle, color: 'red', text: '❌ Cancelled' }
    };
    return badges[status] || badges.pending;
  };

  const getSessionStatusColor = (sessionStatus) => {
    const colors = {
      scheduled: 'bg-blue-100 text-blue-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return colors[sessionStatus] || colors.scheduled;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader className="animate-spin text-blue-600 mb-4" size={32} />
        <p className="text-slate-600 font-medium">Loading your appointments...</p>
      </div>
    );
  }

  if (joinPayload) {
    return (
      <VideoConsultRoom
        joinPayload={joinPayload}
        displayName="Patient"
        appointmentDetails={currentAppointment}
        onLeave={() => {
          setJoinPayload(null);
          setCurrentAppointment(null);
          loadAppointments();
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {error}
        </div>
      )}
      
      {message && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      )}

      {appointments.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
          <Phone size={32} className="mx-auto mb-3 text-slate-400" />
          <p className="text-slate-600 font-medium">No online appointments scheduled</p>
          <p className="text-sm text-slate-500 mt-1">Book an online appointment to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const session = sessions[appointment._id];
            const statusBadge = getStatusBadge(appointment.status);
            const appointmentDate = new Date(appointment.appointmentDate);
            const isUpcoming = appointmentDate > new Date();
            const canJoin = appointment.status === 'confirmed' && isUpcoming && session;
            
            return (
              <div
                key={appointment._id}
                className={`rounded-xl border p-4 transition-shadow ${
                  canJoin ? 'border-emerald-200 bg-emerald-50 hover:shadow-md' : 'border-slate-200 bg-white hover:shadow-md'
                }`}
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Dr. Consultation - {appointment.specialty}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Doctor ID: {appointment.doctorId}
                        </p>
                      </div>
                      {session && (
                        <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${getSessionStatusColor(session.status || 'scheduled')}`}>
                          {session.status || 'scheduled'}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-blue-600" />
                        <span className="font-medium">{appointmentDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={14} className="text-blue-600" />
                        <span className="font-medium">{appointment.timeSlot}</span>
                      </div>
                      {appointment.reason && (
                        <div className="flex gap-2 text-slate-600">
                          <span className="text-xs font-medium">Reason:</span>
                          <span className="text-xs">{appointment.reason}</span>
                        </div>
                      )}
                    </div>

                    {/* Status Display */}
                    <div className="pt-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100">
                        {statusBadge.icon === CheckCircle && <CheckCircle size={14} className="text-emerald-600" />}
                        {statusBadge.icon === AlertCircle && <AlertCircle size={14} className="text-amber-600" />}
                        {statusBadge.icon === XCircle && <XCircle size={14} className="text-red-600" />}
                        <span className="text-xs font-bold text-slate-700">{statusBadge.text}</span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-col gap-2 md:w-48">
                    {canJoin && (
                      <button
                        onClick={() => handleJoinSession(appointment._id)}
                        disabled={joining === appointment._id}
                        className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition shadow-md hover:shadow-lg"
                      >
                        {joining === appointment._id ? (
                          <Loader size={16} className="animate-spin" />
                        ) : (
                          <Phone size={16} />
                        )}
                        Join Consultation
                      </button>
                    )}

                    {appointment.status === 'pending' && (
                      <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-amber-300 bg-amber-50">
                        <AlertCircle size={14} className="text-amber-600" />
                        <span className="text-xs font-bold text-amber-700">Awaiting Confirmation</span>
                      </div>
                    )}

                    {appointment.status === 'rejected' && (
                      <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-red-300 bg-red-50">
                        <XCircle size={14} className="text-red-600" />
                        <span className="text-xs font-bold text-red-700">Request Rejected</span>
                      </div>
                    )}

                    {appointment.status === 'completed' && (
                      <div className="flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-gray-50">
                        <CheckCircle size={14} className="text-gray-600" />
                        <span className="text-xs font-bold text-gray-700">Completed</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PatientAppointmentList;
