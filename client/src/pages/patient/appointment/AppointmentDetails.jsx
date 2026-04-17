import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, FileText, MapPin, UserRound, Video } from 'lucide-react';
import { getMyAppointmentsRequest, getAllDoctorsRequest } from '../../../services/appointment.service';
import { getDoctorByIdForPatient } from '../../../services/patient.service';
import { getDoctorById } from '../../../services/user.service';

const normalizeStatus = (s) => String(s || '').trim().toLowerCase();

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  rejected: 'bg-slate-50 text-slate-600 border-slate-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200',
};

const extractDoctorId = (appt) => {
  if (appt?.doctor?._id) return String(appt.doctor._id);
  if (appt?.doctorId?._id) return String(appt.doctorId._id);
  if (appt?.doctorId) return String(appt.doctorId);
  return '';
};

const extractDoctorUserId = (doctor) => {
  if (doctor?.userId?._id) return String(doctor.userId._id);
  if (doctor?.userId) return String(doctor.userId);
  if (doctor?.user?._id) return String(doctor.user._id);
  if (doctor?.user) return String(doctor.user);
  return '';
};

const getDoctorDisplayName = (doctor) => {
  if (!doctor) return '';

  const directName = doctor?.userId?.name || doctor?.user?.name || doctor?.name || doctor?.fullName;
  if (directName) return String(directName).trim();

  const firstName = doctor?.firstName ? String(doctor.firstName).trim() : '';
  const lastName = doctor?.lastName ? String(doctor.lastName).trim() : '';
  return `${firstName} ${lastName}`.trim();
};

export default function AppointmentDetails() {
  const navigate = useNavigate();
  const location = useLocation();
  const { id } = useParams();

  const [appointment, setAppointment] = useState(location.state?.appointment || null);
  const [loading, setLoading] = useState(!location.state?.appointment);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) {
        setError('Invalid appointment id.');
        setLoading(false);
        return;
      }

      // If we already have the matching appointment from route state, skip extra API calls.
      if (location.state?.appointment?._id && String(location.state.appointment._id) === String(id)) {
        setAppointment(location.state.appointment);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const [list, doctors] = await Promise.all([getMyAppointmentsRequest(), getAllDoctorsRequest('')]);
        const target = (list || []).find((appt) => String(appt?._id) === String(id));

        if (!target) {
          setError('Appointment not found.');
          setAppointment(null);
          return;
        }

        const doctorById = Object.fromEntries((doctors || []).map((doctor) => [String(doctor?._id), doctor]));
        const doctorId = extractDoctorId(target);

        if (!doctorById[doctorId] && doctorId) {
          try {
            const profile = await getDoctorByIdForPatient(doctorId);
            if (profile) doctorById[doctorId] = profile;
          } catch {
            // Best-effort fallback for doctor profile.
          }
        }

        const mergedDoctor = {
          ...(target?.doctor || {}),
          ...(doctorById[doctorId] || {}),
        };

        const doctorUserId = extractDoctorUserId(mergedDoctor);
        if (doctorUserId) {
          try {
            const doctorUser = await getDoctorById(doctorUserId);
            if (doctorUser?.name) {
              mergedDoctor.user = {
                ...(mergedDoctor.user || {}),
                name: doctorUser.name,
              };
            }
          } catch {
            // Best-effort fallback for doctor account name.
          }
        }

        setAppointment({ ...target, doctor: mergedDoctor });
      } catch {
        setError('Failed to load appointment details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id, location.state]);

  const normalizedStatus = useMemo(
    () => normalizeStatus(appointment?.status),
    [appointment?.status]
  );

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <p className="text-slate-600 font-medium">Loading appointment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/patient/appointment/my')}
          className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <ArrowLeft size={16} />
          Back to My Appointments
        </button>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">{error}</div>
      </div>
    );
  }

  if (!appointment) {
    return null;
  }

  const doctor = appointment?.doctor || appointment?.doctorId || {};
  const doctorName = getDoctorDisplayName(doctor) || 'Doctor';
  const specialization = doctor?.specialization || 'General Medicine';
  const fee = doctor?.consultationFee ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => navigate('/patient/appointment/my')}
        className="mb-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      >
        <ArrowLeft size={16} />
        Back to My Appointments
      </button>

      <article className="rounded-3xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="h-1.5 bg-gradient-to-r from-blue-500 to-blue-400" />

        <div className="p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Appointment Details</h1>
              <p className="mt-1 text-slate-500">Reference: {appointment?._id}</p>
            </div>
            <span
              className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-bold ${
                statusStyles[normalizedStatus] || statusStyles.rejected
              }`}
            >
              {normalizedStatus ? normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1) : 'Unknown'}
            </span>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Doctor</p>
              <p className="mt-2 text-lg font-semibold text-slate-800 inline-flex items-center gap-2">
                <UserRound size={18} className="text-blue-600" />
                Dr. {doctorName}
              </p>
              <p className="mt-1 text-sm text-blue-700 font-medium">{specialization}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Consultation Fee</p>
              <p className="mt-2 text-lg font-semibold text-slate-800">LKR {fee}</p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Schedule</p>
              <p className="mt-2 text-slate-800 inline-flex items-center gap-2">
                <Calendar size={16} className="text-blue-600" />
                {appointment?.dayOfWeek || 'N/A'}
              </p>
              <p className="mt-1 text-slate-700 inline-flex items-center gap-2">
                <Clock size={16} className="text-blue-600" />
                {appointment?.startTime && appointment?.endTime
                  ? `${appointment.startTime} - ${appointment.endTime}`
                  : 'N/A'}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Consultation Mode</p>
              <p className="mt-2 text-slate-800 inline-flex items-center gap-2">
                <Video size={16} className="text-blue-600" />
                Online Consultation
              </p>
              <p className="mt-1 text-slate-700 inline-flex items-center gap-2">
                <MapPin size={16} className="text-blue-600" />
                Colombo (Virtual)
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500">Reason for Visit</p>
            <p className="mt-2 text-slate-700">{appointment?.reason || 'No reason provided.'}</p>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-slate-500 inline-flex items-center gap-2">
              <FileText size={14} className="text-blue-600" />
              Additional Notes
            </p>
            <p className="mt-2 text-slate-700">{appointment?.notes || 'No additional notes.'}</p>
          </div>
        </div>
      </article>
    </div>
  );
}
