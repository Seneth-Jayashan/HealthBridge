import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAppointmentsRequest, cancelAppointmentRequest } from '../../../services/appointment.service';
import { Calendar, Clock, Video, MapPin, Stethoscope, Plus } from 'lucide-react';

const statusStyles = {
  pending:   'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-green-100 text-green-700',
  completed: 'bg-blue-100 text-blue-700',
  cancelled: 'bg-red-100 text-red-700',
  rejected:  'bg-slate-100 text-slate-600',
};

const MyAppointments = () => {
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [cancellingId, setCancellingId] = useState(null);

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      // getMyAppointmentsRequest now always returns a plain array
      const list = await getMyAppointmentsRequest();
      setAppointments(list);
    } catch (err) {
      setError('Failed to load appointments. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAppointments(); }, []);

  const handleCancel = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
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
      <div className="flex items-center justify-center py-24">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
          <p className="text-slate-500">Loading your appointments…</p>
        </div>
      </div>
    );
  }

  return (
    <section>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900">My Appointments</h1>
          <p className="mt-2 text-slate-600">View and manage all your booked appointments.</p>
        </div>
        <button
          onClick={() => navigate('/patient/appointment/book')}
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-white font-semibold hover:bg-blue-800 transition-all"
        >
          <Plus size={16} /> Book New
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 border border-red-200 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Empty state */}
      {!error && appointments.length === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className="rounded-full bg-blue-50 p-6 mb-4">
            <Calendar size={40} className="text-blue-700" />
          </div>
          <h2 className="text-xl font-bold text-slate-800">No appointments yet</h2>
          <p className="mt-2 text-slate-500">Book your first appointment to get started.</p>
          <button
            onClick={() => navigate('/patient/appointment/book')}
            className="mt-6 flex items-center gap-2 rounded-xl bg-blue-700 px-6 py-3 text-white font-semibold hover:bg-blue-800"
          >
            <Plus size={16} /> Book Appointment
          </button>
        </div>
      )}

      {/* Appointments list */}
      {appointments.length > 0 && (
        <div className="mt-6 grid gap-4">
          {appointments.map((appt) => (
            <article
              key={appt._id}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <div className="flex items-start justify-between">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Stethoscope size={16} className="text-blue-700" />
                    <span className="font-bold text-slate-900">{appt.specialty}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar size={14} className="text-slate-400" />
                    {new Date(appt.appointmentDate).toDateString()}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock size={14} className="text-slate-400" />
                    {appt.timeSlot}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    {appt.appointmentType === 'online'
                      ? <Video size={14} className="text-blue-500" />
                      : <MapPin size={14} className="text-orange-500" />
                    }
                    {appt.appointmentType === 'online' ? 'Online Consultation' : 'Physical Visit'}
                  </div>
                  {appt.reason && (
                    <p className="text-sm text-slate-500 mt-1">Reason: {appt.reason}</p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-3">
                  <span className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${statusStyles[appt.status] || 'bg-slate-100 text-slate-600'}`}>
                    {appt.status}
                  </span>
                  {appt.status === 'pending' && (
                    <button
                      onClick={() => handleCancel(appt._id)}
                      disabled={cancellingId === appt._id}
                      className="text-xs font-semibold text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                      {cancellingId === appt._id ? 'Cancelling…' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>

              {appt.notes && (
                <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs font-semibold text-slate-500 mb-1">Doctor Notes</p>
                  <p className="text-sm text-slate-700">{appt.notes}</p>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default MyAppointments;