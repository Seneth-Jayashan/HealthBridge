import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAppointmentsRequest, cancelAppointmentRequest, getAllDoctorsRequest, updateAppointmentRequest, getDoctorAvailabilityRequest } from '../../../services/appointment.service';
import { getDoctorByIdForPatient } from '../../../services/patient.service';
import { getDoctorById } from '../../../services/user.service';
import { createPayment } from '../../../services/payment.service'; 
import { useAuth } from '../../../context/AuthContext'; // To get the logged-in patient's ID
import { 
  Calendar, Clock, Plus, Video,
  MapPin, ChevronRight, XCircle, CreditCard, Loader2, FilePenLine, Save
} from 'lucide-react';

const statusStyles = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  accepted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200',
  rejected: 'bg-slate-50 text-slate-600 border-slate-200',
  completed: 'bg-blue-50 text-blue-700 border-blue-200', // Added completed style
};

const normalizeStatus = (s) => String(s || '').trim().toLowerCase();
const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const formatForUiSlot = (startTime, endTime) => {
  const to12 = (t) => {
    let [h, m] = String(t || '').split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${String(m || 0).padStart(2, '0')} ${ampm}`;
  };

  if (!startTime || !endTime) return 'Select a slot';
  return `${to12(startTime)} - ${to12(endTime)}`;
};

const normalizeAvailability = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.availability)) return value.availability;
  if (Array.isArray(value?.data?.availability)) return value.data.availability;
  return [];
};

const extractDoctorId = (appt) => {
  if (appt?.doctor?._id) return String(appt.doctor._id);
  if (appt?.doctorId?._id) return String(appt.doctorId._id);
  if (appt?.doctorId) return String(appt.doctorId);
  return '';
};

const getDoctorDisplayName = (doctor) => {
  if (!doctor) return '';

  const directName =
    doctor?.userId?.name ||
    doctor?.user?.name ||
    doctor?.name ||
    doctor?.fullName;

  if (directName) return String(directName).trim();

  const firstName = doctor?.firstName ? String(doctor.firstName).trim() : '';
  const lastName = doctor?.lastName ? String(doctor.lastName).trim() : '';
  const combined = `${firstName} ${lastName}`.trim();

  return combined;
};

const extractDoctorUserId = (doctor) => {
  if (doctor?.userId?._id) return String(doctor.userId._id);
  if (doctor?.userId) return String(doctor.userId);
  if (doctor?.user?._id) return String(doctor.user._id);
  if (doctor?.user) return String(doctor.user);
  return '';
};

const MyAppointments = () => {
  const navigate = useNavigate();
  const { user } = useAuth(); // Fallback for patientId if not explicitly in the appt object
  
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Action States
  const [cancellingId, setCancellingId] = useState(null);
  const [payingId, setPayingId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [savingId, setSavingId] = useState(null);
  const [loadingAvailabilityId, setLoadingAvailabilityId] = useState(null);
  const [availabilityByAppointmentId, setAvailabilityByAppointmentId] = useState({});
  const [editReason, setEditReason] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editDayOfWeek, setEditDayOfWeek] = useState('');
  const [editTimeSlotId, setEditTimeSlotId] = useState('');
  const [editStartTime, setEditStartTime] = useState('');
  const [editEndTime, setEditEndTime] = useState('');
  
  // Tab State
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' or 'completed'

  const loadAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const [list, doctors] = await Promise.all([
        getMyAppointmentsRequest(),
        getAllDoctorsRequest(''),
      ]);

      const doctorById = Object.fromEntries(
        (doctors || []).map((doctor) => [String(doctor?._id), doctor])
      );

      const doctorIdsInAppointments = [...new Set((list || []).map(extractDoctorId).filter(Boolean))];
      const missingDoctorIds = doctorIdsInAppointments.filter((id) => !doctorById[id]);

      if (missingDoctorIds.length > 0) {
        const fallbackProfiles = await Promise.all(
          missingDoctorIds.map(async (doctorId) => {
            try {
              const profile = await getDoctorByIdForPatient(doctorId);
              return [doctorId, profile];
            } catch {
              return [doctorId, null];
            }
          })
        );

        fallbackProfiles.forEach(([doctorId, profile]) => {
          if (profile) doctorById[doctorId] = profile;
        });
      }

      const enriched = (list || []).map((appt) => {
        const doctorId = extractDoctorId(appt);
        const matchedDoctor = doctorById[doctorId];

        const doctor = {
          ...(appt?.doctor || {}),
          ...(matchedDoctor || {}),
        };

        return {
          ...appt,
          doctor,
        };
      });

      const doctorUserIds = [
        ...new Set(
          enriched
            .map((appt) => extractDoctorUserId(appt?.doctor || appt?.doctorId || {}))
            .filter(Boolean)
        ),
      ];

      let doctorUserById = {};
      if (doctorUserIds.length > 0) {
        const doctorUserEntries = await Promise.all(
          doctorUserIds.map(async (userId) => {
            try {
              const doctorUser = await getDoctorById(userId);
              return [userId, doctorUser];
            } catch {
              return [userId, null];
            }
          })
        );

        doctorUserById = Object.fromEntries(doctorUserEntries.filter(([, value]) => value));
      }

      const enrichedWithNames = enriched.map((appt) => {
        const currentDoctor = appt?.doctor || {};
        const doctorUserId = extractDoctorUserId(currentDoctor);
        const doctorUser = doctorUserById[doctorUserId];

        if (!doctorUser?.name) return appt;

        return {
          ...appt,
          doctor: {
            ...currentDoctor,
            user: {
              ...(currentDoctor?.user || {}),
              name: doctorUser.name,
            },
          },
        };
      });

      setAppointments(enrichedWithNames);
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

  const handlePayment = async (appt) => {
    setPayingId(appt._id);
    try {
      if (!window.payhere) {
        throw new Error('PayHere SDK not loaded. Please refresh the page.');
      }

      const doctorId = extractDoctorId(appt);
      const patientId = appt.patient?._id || appt.patientId || appt.patient || user?._id || user?.id;
      const doctorName = getDoctorDisplayName(appt.doctor || appt.doctorId) || 'Doctor';

      const paymentData = {
        patientId: String(patientId),
        doctorId: String(doctorId),
        appointmentId: String(appt._id),
        currency: 'LKR',
      };

      // Call your backend to create the order and generate the hash
      const response = await createPayment(paymentData);

      // Verify the backend actually returned what we need for Checkout API
      if (!response.hash || !response.order_id || !response.amount || !response.merchant_id) {
        throw new Error("Invalid payment data received from server.");
      }
      
      const paymentObject = {
        sandbox: response.sandbox ?? true,
        merchant_id: response.merchant_id,
        return_url: response.return_url || `${window.location.origin}/patient/appointments`,
        cancel_url: response.cancel_url || `${window.location.origin}/patient/appointments`,
        notify_url: `https://eufemia-chromic-treasa.ngrok-free.dev/public/api/payments/notify` || `${window.location.origin}/api/payments/notify`,

        order_id: response.order_id,
        items: response.items || `Consultation Fee - Dr. ${doctorName}`,

        // Use EXACTLY what the backend returns to keep the hash valid.
        amount: response.amount,
        currency: response.currency || 'LKR',
        hash: response.hash,

        first_name: user?.name?.split(' ')[0] || 'Patient',
        last_name: user?.name?.split(' ')[1] || 'Name',
        email: user?.email || 'patient@healthbridge.com',
        phone: user?.phoneNumber || '0770000000',
        address: user?.address || 'HealthBridge Clinic',
        city: response.city || 'Colombo',
        country: response.country || 'Sri Lanka',

        custom_1: response.custom_1 || String(appt._id),
        custom_2: response.custom_2 || String(patientId),
      };
      console.log("Initiating payment with object:", paymentObject);

      // Define Callbacks
      window.payhere.onCompleted = async function onCompleted(orderId) {
        console.log("Payment completed. OrderID:" + orderId);
        alert("Payment Successful! Your appointment is confirmed.");
        await loadAppointments(); 
      };

      window.payhere.onDismissed = function onDismissed() {
        console.log("Payment dismissed");
      };

      window.payhere.onError = function onError(error) {
        console.log("Payment Error:" + error);
        alert("An error occurred during payment: " + error);
      };

      // Trigger the PayHere Popup
      window.payhere.startPayment(paymentObject);

    } catch (err) {
      console.error("Payment Initiation Error:", err);
      alert(err?.response?.data?.message || err.message || 'Failed to initiate payment.');
    } finally {
      setPayingId(null);
    }
  };

  const startEditing = async (appt) => {
    setEditingId(appt._id);
    setEditReason(appt?.reason || '');
    setEditNotes(appt?.notes || '');
    setEditDayOfWeek(appt?.dayOfWeek || '');
    setEditTimeSlotId(appt?.timeSlotId ? String(appt.timeSlotId) : '');
    setEditStartTime(appt?.startTime || '');
    setEditEndTime(appt?.endTime || '');

    const doctorId = extractDoctorId(appt);
    if (!doctorId) {
      setAvailabilityByAppointmentId((prev) => ({ ...prev, [appt._id]: [] }));
      return;
    }

    setLoadingAvailabilityId(appt._id);
    try {
      const availability = await getDoctorAvailabilityRequest(doctorId);
      setAvailabilityByAppointmentId((prev) => ({
        ...prev,
        [appt._id]: normalizeAvailability(availability),
      }));
    } catch (err) {
      setAvailabilityByAppointmentId((prev) => ({ ...prev, [appt._id]: [] }));
      alert(err?.response?.data?.message || 'Failed to load available time slots.');
    } finally {
      setLoadingAvailabilityId(null);
    }
  };

  const stopEditing = () => {
    setEditingId(null);
    setSavingId(null);
    setEditReason('');
    setEditNotes('');
    setEditDayOfWeek('');
    setEditTimeSlotId('');
    setEditStartTime('');
    setEditEndTime('');
  };

  const handleSaveEdit = async (apptId) => {
    if (!String(editReason || '').trim()) {
      alert('Reason is required.');
      return;
    }

    setSavingId(apptId);
    try {
      await updateAppointmentRequest(apptId, {
        reason: String(editReason || '').trim(),
        notes: String(editNotes || '').trim(),
        dayOfWeek: editDayOfWeek,
        timeSlotId: editTimeSlotId,
        startTime: editStartTime,
        endTime: editEndTime,
      });

      await loadAppointments();
      stopEditing();
    } catch (err) {
      alert(err?.response?.data?.message || 'Failed to update appointment.');
      setSavingId(null);
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

  // Filter appointments based on active tab
  const displayedAppointments = appointments.filter((appt) => {
    const isCompleted = normalizeStatus(appt.status) === 'completed';
    return activeTab === 'completed' ? isCompleted : !isCompleted;
  });

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
          className="inline-flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-md shadow-blue-200 transition-all self-start sm:self-auto"
        >
          <Plus size={18} />
          Book New
        </button>
      </div>

      {/* Custom Tabs */}
      <div className="flex items-center gap-4 border-b border-slate-200 mb-8">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`pb-4 px-2 text-sm font-bold transition-colors relative ${
            activeTab === 'upcoming' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Upcoming & Active
          {activeTab === 'upcoming' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`pb-4 px-2 text-sm font-bold transition-colors relative ${
            activeTab === 'completed' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Completed History
          {activeTab === 'completed' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-t-full" />
          )}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl">
          {error}
        </div>
      )}

      {/* Empty State */}
      {!error && displayedAppointments.length === 0 && (
        <div className="mt-16 flex flex-col items-center justify-center text-center">
          <div className={`rounded-2xl p-6 mb-6 shadow-xl ${activeTab === 'completed' ? 'bg-gradient-to-br from-slate-400 to-slate-500 shadow-slate-200' : 'bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-200'}`}>
            <Calendar size={48} className="text-white" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800">
            {activeTab === 'completed' ? 'No completed appointments' : 'No upcoming appointments'}
          </h2>
          <p className="mt-2 text-slate-500">
            {activeTab === 'completed' 
              ? "You haven't completed any consultations yet." 
              : "Book your first consultation with a specialist."}
          </p>
          {activeTab === 'upcoming' && (
            <button
              onClick={() => navigate('/patient/appointment/book')}
              className="mt-6 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-md shadow-blue-200 transition-all"
            >
              <Plus size={18} />
              Find a Doctor
            </button>
          )}
        </div>
      )}

      {/* Appointments Grid */}
      {displayedAppointments.length > 0 && (
        <div className="grid grid-cols-1 gap-5">
          {displayedAppointments.map((appt) => {
            const status = normalizeStatus(appt.status);
            const paymentStatus = normalizeStatus(appt.paymentStatus);
            const isEditing = editingId === appt._id;
            const doctorAvailability = availabilityByAppointmentId[appt._id] || [];
            const availableDaysSet = new Set(doctorAvailability.map((d) => d.dayOfWeek));
            if (appt?.dayOfWeek) availableDaysSet.add(appt.dayOfWeek);
            const availableDays = dayNames.filter((d) => availableDaysSet.has(d));

            const selectedDaySchedule = doctorAvailability.find((d) => d.dayOfWeek === editDayOfWeek);
            const slotOptions = [
              ...((selectedDaySchedule?.timeSlots || [])
                .filter((slot) => !slot.isBooked || String(slot._id) === String(appt?.timeSlotId))
                .map((slot) => ({
                  _id: String(slot._id),
                  startTime: slot.startTime,
                  endTime: slot.endTime,
                  label: formatForUiSlot(slot.startTime, slot.endTime),
                }))),
            ];

            if (
              editDayOfWeek === appt?.dayOfWeek &&
              appt?.timeSlotId &&
              !slotOptions.some((slot) => slot._id === String(appt.timeSlotId))
            ) {
              slotOptions.push({
                _id: String(appt.timeSlotId),
                startTime: appt.startTime,
                endTime: appt.endTime,
                label: formatForUiSlot(appt.startTime, appt.endTime),
              });
            }

            const doctor = appt.doctor || appt.doctorId || {};
            const doctorName = getDoctorDisplayName(doctor) || 'Doctor';
            const specialization = doctor?.specialization || 'General Medicine';
            const fee = doctor?.consultationFee ?? 0;

            return (
              <article
                key={appt._id}
                className="group bg-white/80 backdrop-blur-sm rounded-3xl border border-white/40 shadow-lg shadow-blue-100/30 hover:shadow-xl hover:shadow-blue-100/50 transition-all duration-200 overflow-hidden"
              >
                {/* Top accent bar based on status */}
                <div
                  className={`h-1.5 w-full ${
                    status === 'accepted' && paymentStatus === 'pending'
                      ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                      : status === 'pending'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                      : status === 'cancelled'
                      ? 'bg-gradient-to-r from-rose-500 to-rose-400'
                      : status === 'completed'
                      ? 'bg-gradient-to-r from-blue-500 to-blue-400'
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
                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${statusStyles[status] || statusStyles.rejected}`}
                              >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                              </span>
                            </h3>
                            <p className="text-blue-600 font-medium text-sm mt-0.5">{specialization}</p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-blue-700">LKR {fee}</span>
                            <p className="text-xs text-slate-400 mt-0.5">per visit</p>
                          </div>
                        </div>

                        {/* Appointment Details */}
                        {isEditing ? (
                          <div className="mt-4 rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50/80 to-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                              <h4 className="text-sm font-extrabold uppercase tracking-wide text-blue-700">
                                Edit Appointment
                              </h4>
                              <span className="text-xs font-semibold text-slate-500">
                                Update schedule and notes before saving
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <label className="block">
                                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Day
                                </span>
                                <select
                                  value={editDayOfWeek}
                                  onChange={(e) => {
                                    setEditDayOfWeek(e.target.value);
                                    setEditTimeSlotId('');
                                    setEditStartTime('');
                                    setEditEndTime('');
                                  }}
                                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                  <option value="" disabled>Select day</option>
                                  {availableDays.map((day) => (
                                    <option key={day} value={day}>{day}</option>
                                  ))}
                                </select>
                              </label>

                              <label className="block">
                                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Time Slot
                                </span>
                                <select
                                  value={editTimeSlotId}
                                  onChange={(e) => {
                                    const slotId = e.target.value;
                                    setEditTimeSlotId(slotId);
                                    const slot = slotOptions.find((option) => option._id === slotId);
                                    setEditStartTime(slot?.startTime || '');
                                    setEditEndTime(slot?.endTime || '');
                                  }}
                                  disabled={!editDayOfWeek || loadingAvailabilityId === appt._id}
                                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                                >
                                  <option value="" disabled>
                                    {loadingAvailabilityId === appt._id ? 'Loading slots...' : 'Select time'}
                                  </option>
                                  {slotOptions.map((slot) => (
                                    <option key={slot._id} value={slot._id}>{slot.label}</option>
                                  ))}
                                </select>
                              </label>
                            </div>

                            <div className="mt-3 rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs text-slate-600">
                              {editStartTime && editEndTime
                                ? `Selected time: ${formatForUiSlot(editStartTime, editEndTime)}`
                                : 'Choose a day and time slot to continue.'}
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3">
                              <label className="block">
                                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Reason for Visit
                                </span>
                                <textarea
                                  value={editReason}
                                  onChange={(e) => setEditReason(e.target.value)}
                                  rows={3}
                                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Describe the main concern for this consultation"
                                />
                              </label>

                              <label className="block">
                                <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-slate-500">
                                  Additional Notes
                                </span>
                                <textarea
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  rows={3}
                                  className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                  placeholder="Add extra notes (optional)"
                                />
                              </label>
                            </div>
                          </div>
                        ) : (
                          <>
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

                            {appt.reason && (
                              <div className="mt-4 p-3 bg-slate-50/80 rounded-xl border border-slate-100">
                                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                                  Reason for visit
                                </p>
                                <p className="text-sm text-slate-700">{appt.reason}</p>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex sm:flex-col items-stretch gap-2 sm:border-l sm:border-slate-200 sm:pl-4">

                      {status === 'pending' && !isEditing && (
                        <button
                          onClick={() => startEditing(appt)}
                          className="inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-200 bg-white text-blue-700 hover:bg-blue-50 text-sm font-bold transition-colors"
                        >
                          <FilePenLine size={16} />
                          Edit
                        </button>
                      )}

                      {isEditing && (
                        <>
                          <button
                            onClick={() => handleSaveEdit(appt._id)}
                            disabled={savingId === appt._id || loadingAvailabilityId === appt._id || !editDayOfWeek || !editTimeSlotId}
                            className="inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-xl border border-transparent bg-blue-600 text-white hover:bg-blue-700 text-sm font-bold transition-colors disabled:opacity-50"
                          >
                            {savingId === appt._id ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                            {savingId === appt._id ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={stopEditing}
                            disabled={savingId === appt._id}
                            className="inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-bold transition-colors disabled:opacity-50"
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      
                      {/* Show Payment Button if Status is Accepted */}
                      {status === 'accepted' && (
                        <button
                          onClick={() => handlePayment(appt)}
                          disabled={payingId === appt._id}
                          className="inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-xl border border-transparent bg-emerald-600 text-white hover:bg-emerald-700 text-sm font-bold transition-all shadow-md shadow-emerald-200 disabled:opacity-50"
                        >
                          {payingId === appt._id ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <CreditCard size={16} />
                          )}
                          {payingId === appt._id ? 'Processing...' : 'Pay Now'}
                        </button>
                      )}

                      {status === 'pending' && !isEditing && (
                        <button
                          onClick={() => handleCancel(appt._id)}
                          disabled={cancellingId === appt._id}
                          className="inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-xl border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 text-sm font-bold transition-colors disabled:opacity-50"
                        >
                          <XCircle size={16} />
                          {cancellingId === appt._id ? 'Cancelling…' : 'Cancel'}
                        </button>
                      )}
                      
                      {!isEditing && (
                        <button
                          onClick={() => navigate(`/patient/appointment/${appt._id}`)}
                          className="inline-flex justify-center items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 text-sm font-bold transition-colors"
                        >
                          Details
                          <ChevronRight size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {!isEditing && appt.notes && (
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