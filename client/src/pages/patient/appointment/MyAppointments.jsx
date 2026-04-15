import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAppointmentsRequest, cancelAppointmentRequest } from '../../../services/appointment.service';
import { Calendar, Clock, Stethoscope, Plus, Video, MapPin, User, ChevronRight, XCircle } from 'lucide-react';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  rejected: 'bg-slate-50 text-slate-600 border-slate-200',
};

const normalizeStatus = (s) => String(s || '').trim().toLowerCase();

const getDoctorDisplayName = (doctor) => {
  if (!doctor) return 'Unknown';
  return (
    doctor?.userId?.name ||
    doctor?.user?.name ||
    doctor?.name ||
    doctor?.fullName ||
    doctor?.doctorID ||
    'Unknown'
  );
};

const MyAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const list = await getMyAppointmentsRequest();
      setAppointments(list);
    } catch (err) {
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Cancel this appointment?')) return;
    setCancellingId(id);
    try {
      await cancelAppointmentRequest(id);
      await loadAppointments();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to cancel appointment.');
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 mb-6 shadow-xl shadow-blue-200">
          <Calendar size={48} className="text-white animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Loading your appointments</h2>
        <p className="mt-2 text-slate-500">Just a moment…</p>
        <div className="mt-6 w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full w-2/3 bg-blue-500 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
      {/* Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            My <span className="text-blue-600">Appointments</span>
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Track and manage your upcoming consultations</p>
        </div>
        <button
          onClick={() => navigate('/patient/appointment/book')}
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-md shadow-blue-200 transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          Book New
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!error && appointments.length === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 mb-6 shadow-xl shadow-blue-200">
            <Calendar size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">No appointments yet</h2>
          <p className="mt-2 text-slate-500">Book your first consultation with a specialist.</p>
          <button
            onClick={() => navigate('/patient/appointment/book')}
            className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-md shadow-blue-200 transition-all"
          >
            <Plus size={18} />
            Find a Doctor
          </button>
        </div>
      )}

      {/* Appointments Grid */}
      {appointments.length > 0 && (
        <div className="grid grid-cols-1 gap-5">
          {appointments.map((appt) => {
            const status = normalizeStatus(appt.status);
            const doctor = appt.doctorId || appt.doctor || {};
            const doctorName = getDoctorDisplayName(doctor);
            const specialization = doctor?.specialization || 'General Medicine';
            const fee = doctor?.consultationFee ?? appt.consultationFee ?? 0;

            return (
              <article
                key={appt._id}
                className="group bg-white/80 backdrop-blur-sm rounded-3xl border border-white/40 shadow-lg shadow-blue-100/30 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-200 overflow-hidden"
              >
                {/* Top accent bar based on status */}
                <div
                  className={`h-1.5 w-full ${
                    status === 'accepted'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : status === 'pending'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                      : status === 'cancelled'
                      ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                      : 'bg-gradient-to-r from-slate-400 to-slate-300'
                  }`}
                />

                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    {/* Doctor Avatar & Info */}
                    <div className="flex items-start gap-4 flex-1">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm flex-shrink-0">
                        {doctorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg leading-tight flex items-center gap-2">
                              Dr. {doctorName}
                              <span
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusStyles[status]}`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </h3>
                            <p className="text-blue-600 font-medium text-sm mt-0.5">{specialization}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-blue-700">LKR {fee}</span>
                            <p className="text-xs text-slate-400">consultation</p>
                          </div>
                        </div>

                        {/* Appointment Details */}
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <Calendar size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Day</p>
                              <p className="font-medium text-slate-700">{appt.dayOfWeek || '—'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <Clock size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Time</p>
                              <p className="font-medium text-slate-700">
                                {appt.startTime && appt.endTime
                                  ? `${appt.startTime} - ${appt.endTime}`
                                  : '—'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <Video size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Mode</p>
                              <p className="font-medium text-slate-700">Online Consultation</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-sm">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                              <MapPin size={16} className="text-blue-600" />
                            </div>
                            <div>
                              <p className="text-xs text-slate-400">Location</p>
                              <p className="font-medium text-slate-700">Colombo (Virtual)</p>
                            </div>
                          </div>
                        </div>

                        {/* Reason */}
                        {appt.reason && (
                          <div className="mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                              Reason for visit
                            </p>
                            <p className="text-sm text-slate-700">{appt.reason}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex sm:flex-col items-start gap-2 sm:border-l sm:border-slate-200 sm:pl-4">
                      {status === 'pending' && (
                        <button
                          onClick={() => handleCancel(appt._id)}
                          disabled={cancellingId === appt._id}
                          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 text-sm font-medium transition-colors disabled:opacity-50"
                        >
                          <XCircle size={16} />
                          {cancellingId === appt._id ? 'Cancelling…' : 'Cancel'}
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/patient/appointment/${appt._id}`)}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-medium transition-colors"
                      >
                        Details
                        <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Notes */}
                  {appt.notes && (
                    <div className="mt-4 pt-4 border-t border-slate-200/80">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                        Additional Notes
                      </p>
                      <p className="text-sm text-slate-600">{appt.notes}</p>
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyAppointments;