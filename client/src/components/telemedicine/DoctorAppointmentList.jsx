import React, { useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Phone, CheckCircle, XCircle, AlertCircle, Loader } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getDoctorOnlineAppointmentsRequest, updateAppointmentStatusRequest } from '../../services/appointment.service';
import { getOnlineAppointmentsWithSessions, updateSessionStatus, createTelemedicineSession } from '../../services/telemedicine.service';

const DoctorAppointmentList = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [sessions, setSessions] = useState({});
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [appts, sess] = await Promise.all([
        getDoctorOnlineAppointmentsRequest(),
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

  const handleStatusUpdate = async (appointmentId, newStatus) => {
    setUpdating(appointmentId);
    setError('');
    
    try {
      const appointment = appointments.find(a => a._id === appointmentId);
      const session = sessions[appointmentId];
      
      // Update appointment status
      await updateAppointmentStatusRequest(appointmentId, newStatus);
      
      // Update video session status if it exists
      if (session) {
        const sessionStatus = newStatus === 'confirmed' ? 'scheduled' : 
                             newStatus === 'completed' ? 'completed' : 'cancelled';
        await updateSessionStatus(session._id, sessionStatus);
      }
      
      setMessage(`Appointment ${newStatus} successfully`);
      setTimeout(() => {
        setMessage('');
        loadAppointments();
      }, 2000);
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to update appointment');
    } finally {
      setUpdating(null);
    }
  };

  const handleStartCall = async (appointmentId) => {
    setUpdating(appointmentId);
    setError('');
    
    try {
      const appointment = appointments.find(a => a._id === appointmentId);
      let session = sessions[appointmentId];
      
      // Create a new video session if one doesn't exist
      if (!session) {
        const createdSession = await createTelemedicineSession({
          appointmentId,
          patientId: appointment.patientId,
          scheduledAt: appointment.appointmentDate,
          metadata: {
            specialty: appointment.specialty,
            reason: appointment.reason,
            timeSlot: appointment.timeSlot
          }
        });
        session = createdSession;
      }
      
      // Redirect to Telehealth page with session
      navigate('/doctor/telehealth', {
        state: {
          sessionId: session._id,
          autoJoin: true,
          appointmentId: appointmentId
        }
      });
      
      setMessage('Starting video call...');
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to start video call');
    } finally {
      setUpdating(null);
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { icon: AlertCircle, color: 'amber', text: '⏳ Pending' },
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
        <Loader className="animate-spin text-teal-600 mb-4" size={32} />
        <p className="text-slate-600 font-medium">Loading appointments...</p>
      </div>
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
          <p className="text-slate-600 font-medium">No online appointments</p>
          <p className="text-sm text-slate-500 mt-1">Online appointments will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appointment) => {
            const session = sessions[appointment._id];
            const statusBadge = getStatusBadge(appointment.status);
            const appointmentDate = new Date(appointment.appointmentDate);
            const isUpcoming = appointmentDate > new Date();
            
            return (
              <div
                key={appointment._id}
                className="rounded-xl border border-slate-200 bg-white p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div className="flex-1 space-y-2">
                    {/* Header */}
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-slate-900">
                          Consultation - {appointment.specialty}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Patient ID: {appointment.patientId}
                        </p>
                      </div>
                      <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${getSessionStatusColor(session?.status || 'scheduled')}`}>
                        {session?.status || 'scheduled'}
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-slate-600">
                        <Calendar size={14} className="text-teal-600" />
                        <span>{appointmentDate.toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-slate-600">
                        <Clock size={14} className="text-teal-600" />
                        <span>{appointment.timeSlot}</span>
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
                    {appointment.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleStatusUpdate(appointment._id, 'confirmed')}
                          disabled={updating === appointment._id}
                          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-700 disabled:opacity-50 transition"
                        >
                          {updating === appointment._id ? (
                            <Loader size={14} className="animate-spin" />
                          ) : (
                            <CheckCircle size={14} />
                          )}
                          Confirm
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(appointment._id, 'rejected')}
                          disabled={updating === appointment._id}
                          className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-600 text-white text-sm font-bold hover:bg-red-700 disabled:opacity-50 transition"
                        >
                          {updating === appointment._id ? (
                            <Loader size={14} className="animate-spin" />
                          ) : (
                            <XCircle size={14} />
                          )}
                          Reject
                        </button>
                      </>
                    )}
                    
                    {appointment.status === 'confirmed' && isUpcoming && (
                      <button
                        onClick={() => handleStartCall(appointment._id)}
                        disabled={updating === appointment._id}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-bold hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        {updating === appointment._id ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <Phone size={14} />
                        )}
                        Start Call
                      </button>
                    )}

                    {(appointment.status === 'confirmed' || appointment.status === 'pending') && (
                      <button
                        onClick={() => handleStatusUpdate(appointment._id, 'cancelled')}
                        disabled={updating === appointment._id}
                        className="flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-red-300 text-red-600 text-sm font-bold hover:bg-red-50 disabled:opacity-50 transition"
                      >
                        {updating === appointment._id ? (
                          <Loader size={14} className="animate-spin" />
                        ) : (
                          <XCircle size={14} />
                        )}
                        Cancel
                      </button>
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

export default DoctorAppointmentList;
