import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, Stethoscope, User, Video, X, ChevronRight, MapPin, Phone } from 'lucide-react';
import {
  getAllDoctorsRequest,
  bookAppointmentRequest,
  getDoctorAvailabilityRequest,
} from '../../../services/appointment.service';
import { getDoctorByIdForPatient } from '../../../services/patient.service';
import { getDoctorById } from '../../../services/user.service';
import { useAuth } from '../../../context/AuthContext';

const specialties = [
  'Cardiology',
  'Neurology',
  'Dermatology',
  'Orthopedics',
  'Pediatrics',
  'Psychiatry',
  'Gynecology',
  'Ophthalmology',
  'Dentistry',
  'General Medicine',
];

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const formatForUiSlot = (startTime, endTime) => {
  const to12 = (t) => {
    let [h, m] = t.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
  };
  if (!startTime || !endTime) return `${startTime}-${endTime}`;
  return `${to12(startTime)} - ${to12(endTime)}`;
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
  return `${firstName} ${lastName}`.trim();
};

const extractDoctorUserId = (doctor) => {
  if (doctor?.userId?._id) return String(doctor.userId._id);
  if (doctor?.userId) return String(doctor.userId);
  if (doctor?.user?._id) return String(doctor.user._id);
  if (doctor?.user) return String(doctor.user);
  return '';
};

const normalizeAvailability = (value) => {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.availability)) return value.availability;
  if (Array.isArray(value?.data?.availability)) return value.data.availability;
  return [];
};

const BookAppointment = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [specialty, setSpecialty] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [doctorAvailability, setDoctorAvailability] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [selectedDate, setSelectedDate] = useState('');
  const [timeSlotId, setTimeSlotId] = useState('');
  const [patientPhone, setPatientPhone] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const [searching, setSearching] = useState(false);
  const [booking, setBooking] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [success, setSuccess] = useState(false);

  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isModalOpen]);

  useEffect(() => {
    loadDoctors('');
  }, []);

  const loadDoctors = async (specialization) => {
    setSearching(true);
    setSearchError('');
    setDoctors([]);
    setSelectedDoctor(null);
    setDoctorAvailability([]);
    setSelectedDate('');
    setTimeSlotId('');
    setIsModalOpen(false);
    try {
      const list = await getAllDoctorsRequest(specialization);

      if (list.length > 0) {
        const doctorUserIds = [...new Set(list.map(extractDoctorUserId).filter(Boolean))];

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

        const enrichedDoctors = list.map((doctor) => {
          const doctorUserId = extractDoctorUserId(doctor);
          const doctorUser = doctorUserById[doctorUserId];

          if (!doctorUser?.name) return doctor;

          return {
            ...doctor,
            user: {
              ...(doctor?.user || {}),
              name: doctorUser.name,
            },
          };
        });

        setDoctors(enrichedDoctors);
      } else {
        setSearchError('No verified doctors found for this specialty.');
      }
    } catch (err) {
      setSearchError(err?.response?.data?.message || 'Failed to load doctors. Please try again.');
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => loadDoctors(specialty);
  const handleViewAll = () => {
    setSpecialty('');
    loadDoctors('');
  };

  const handleSelectDoctor = async (doc) => {
    setSelectedDoctor(doc);
    setSelectedDate('');
    setTimeSlotId('');
    setPatientPhone(String(user?.phoneNumber || '').trim());
    setDoctorAvailability([]);
    setBookingError('');

    try {
      setLoadingAvailability(true);
      const doctorId = doc?._id;
      const doctorProfile = await getDoctorByIdForPatient(doctorId);
      const profileAvailability = normalizeAvailability(doctorProfile);

      if (profileAvailability.length > 0) {
        setDoctorAvailability(profileAvailability);
      } else {
        const availability = await getDoctorAvailabilityRequest(doctorId);
        setDoctorAvailability(normalizeAvailability(availability));
      }
      setIsModalOpen(true);
    } catch (err) {
      setDoctorAvailability([]);
      setBookingError(err?.response?.data?.message || 'Failed to load doctor availability');
      setIsModalOpen(true);
    } finally {
      setLoadingAvailability(false);
    }
  };

  const closeModal = () => setIsModalOpen(false);

  const getWeekDaysWithDates = () => {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(today.getDate() + 1);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');
      week.push({
        dayOfWeek: dayNames[date.getDay()],
        date: `${yyyy}-${mm}-${dd}`,
        dateFormatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    return week;
  };

  const currentWeek = useMemo(() => getWeekDaysWithDates(), []);

  const selectedDateObj = useMemo(
    () => currentWeek.find((d) => d.date === selectedDate) || null,
    [selectedDate, currentWeek]
  );

  const selectedDayOfWeek = selectedDateObj?.dayOfWeek || '';

  const availableSlotsForSelectedDate = useMemo(() => {
    if (!selectedDayOfWeek || !doctorAvailability.length) return [];
    const schedule = doctorAvailability.find((d) => d.dayOfWeek === selectedDayOfWeek);
    if (!schedule?.timeSlots?.length) return [];
    return schedule.timeSlots
      .filter((slot) => slot.isBooked === false || typeof slot.isBooked === 'undefined')
      .map((slot) => ({
        _id: slot._id,
        startTime: slot.startTime,
        endTime: slot.endTime,
        display: formatForUiSlot(slot.startTime, slot.endTime),
        apiFormat: `${slot.startTime}-${slot.endTime}`,
      }));
  }, [selectedDayOfWeek, doctorAvailability]);

  const selectedSlot = useMemo(
    () => availableSlotsForSelectedDate.find((s) => String(s._id) === String(timeSlotId)) || null,
    [availableSlotsForSelectedDate, timeSlotId]
  );

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !selectedSlot) {
      setBookingError('Please select a doctor, date, and available time slot.');
      return;
    }
    if (!String(patientPhone || '').trim()) {
      setBookingError('Phone number is required.');
      return;
    }
    if (!String(reason || '').trim()) {
      setBookingError('Reason is required.');
      return;
    }
    setBooking(true);
    setBookingError('');
    try {
      await bookAppointmentRequest({
        doctorId: selectedDoctor._id,
        dayOfWeek: selectedDayOfWeek,
        timeSlotId: selectedSlot._id,
        startTime: selectedSlot.startTime,
        endTime: selectedSlot.endTime,
        patientPhone,
        reason,
        notes,
      });
      setSuccess(true);
      setIsModalOpen(false);
      setTimeout(() => navigate('/patient/appointment/my'), 1600);
    } catch (err) {
      setBookingError(err?.response?.data?.message || err?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 mb-6 shadow-xl shadow-blue-200">
          <Calendar size={48} className="text-white" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 tracking-tight">Appointment Booked!</h2>
        <p className="mt-2 text-slate-500">Redirecting to your appointments…</p>
        <div className="mt-6 w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full w-full bg-blue-500 rounded-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-4 py-6 md:py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-extrabold text-slate-800 tracking-tight">
            Find your doctor,
            <span className="text-blue-600"> book instantly</span>
          </h1>
          <p className="text-slate-500 mt-2 text-lg">Online consultations with top specialists</p>
        </div>

        {/* Search Card */}
        <div className="bg-white/70 backdrop-blur-sm rounded-3xl border border-white/40 shadow-xl shadow-blue-100/50 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Stethoscope className="absolute left-4 top-1/2 -translate-y-1/2 text-blue-400" size={20} />
              <select
                value={specialty}
                onChange={(e) => setSpecialty(e.target.value)}
                className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-slate-200 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-400 transition-all appearance-none"
              >
                <option value="">All Specialties</option>
                {specialties.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSearch}
                disabled={searching}
                className="px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-2xl shadow-md shadow-blue-200 transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Search size={18} />
                {searching ? 'Searching' : 'Search'}
              </button>
              <button
                onClick={handleViewAll}
                disabled={searching}
                className="px-6 py-3.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold rounded-2xl transition-all disabled:opacity-50"
              >
                View All
              </button>
            </div>
          </div>
          {searchError && (
            <p className="mt-4 text-sm text-red-500 bg-red-50 px-4 py-2 rounded-xl">{searchError}</p>
          )}
        </div>

        {/* Doctor List */}
        {doctors.length > 0 && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-800">
                Available Doctors <span className="text-slate-400 font-normal ml-2">({doctors.length})</span>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {doctors.map((doc) => {
                const isSelected = selectedDoctor?._id === doc._id;
                const doctorName = getDoctorDisplayName(doc) || 'Doctor';
                return (
                  <div
                    key={doc._id}
                    onClick={() => handleSelectDoctor(doc)}
                    className={`group cursor-pointer rounded-2xl border transition-all duration-200 ${
                      isSelected
                        ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-lg shadow-blue-100'
                        : 'border-slate-200/80 bg-white hover:border-blue-300 hover:shadow-md'
                    } p-5`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                        {doctorName.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-bold text-slate-800 text-lg">
                              Dr. {doctorName}
                            </h3>
                            <p className="text-blue-600 font-medium text-sm mt-0.5">
                              {doc.specialization || 'General Medicine'}
                            </p>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-blue-700">LKR {doc.consultationFee ?? 0}</span>
                            <p className="text-xs text-slate-400 mt-0.5">per visit</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-500">
                          <span className="flex items-center gap-1"><Video size={14} /> Online</span>
                          <span className="flex items-center gap-1"><MapPin size={14} /> Colombo</span>
                        </div>
                      </div>
                      <ChevronRight className={`text-blue-400 transition-transform ${isSelected ? 'rotate-90' : 'group-hover:translate-x-1'}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ========== POP MODAL ========== */}
      {isModalOpen && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-sm transition-opacity duration-300"
            onClick={closeModal}
          />

          {/* Modal Card */}
          <div
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl shadow-blue-500/10 border border-white/20 overflow-hidden animate-in zoom-in-95 fade-in duration-200"
            style={{ background: 'linear-gradient(145deg, #ffffff 0%, #fafcff 100%)' }}
          >
            {/* Decorative Gradient Bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-blue-500 via-blue-400 to-indigo-500" />

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-200">
                  {(getDoctorDisplayName(selectedDoctor) || 'Doctor').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">
                    Dr. {getDoctorDisplayName(selectedDoctor) || 'Doctor'}
                  </h3>
                  <p className="text-xs text-blue-600 font-medium">{selectedDoctor.specialization}</p>
                </div>
              </div>
              <button
                onClick={closeModal}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="px-5 pb-5 space-y-4">
              {/* Fee & Type */}
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-full">
                  <Video size={14} /> Online Consultation
                </span>
                <span className="text-lg font-bold text-blue-700">LKR {selectedDoctor.consultationFee ?? 0}</span>
              </div>

              {/* Date Picker */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  <Calendar size={14} className="inline mr-1.5 text-blue-500" />
                  Select Date
                </label>
                {loadingAvailability ? (
                  <div className="grid grid-cols-7 gap-1.5">
                    {[...Array(7)].map((_, i) => (
                      <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1.5">
                    {currentWeek.map((dayData) => {
                      const availability = doctorAvailability.find((a) => a.dayOfWeek === dayData.dayOfWeek);
                      const hasSlots = availability?.timeSlots?.some(
                        (slot) => slot.isBooked === false || typeof slot.isBooked === 'undefined'
                      );
                      const isSelected = selectedDate === dayData.date;
                      return (
                        <button
                          key={dayData.date}
                          onClick={() => {
                            setSelectedDate(dayData.date);
                            setTimeSlotId('');
                          }}
                          disabled={!hasSlots}
                          className={`relative rounded-xl py-2.5 text-center transition-all duration-150 ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-md shadow-blue-200 scale-[1.02]'
                              : hasSlots
                              ? 'bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50/50 text-slate-700'
                              : 'bg-slate-50 border border-slate-100 text-slate-300 cursor-not-allowed'
                          }`}
                        >
                          <div className="text-[10px] font-bold uppercase tracking-wide">
                            {dayData.dayOfWeek.slice(0, 3)}
                          </div>
                          <div className="text-sm font-bold mt-0.5">{dayData.dateFormatted}</div>
                          {hasSlots && !isSelected && (
                            <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full border border-white" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
                {!loadingAvailability && doctorAvailability.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-xl">
                    No availability set
                  </p>
                )}
              </div>

              {/* Selected Date Display */}
              {selectedDateObj && (
                <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl border border-blue-100/50">
                  <p className="text-[10px] text-blue-500 font-semibold uppercase tracking-wider">Appointment Date</p>
                  <p className="text-xl font-bold text-blue-800">
                    {selectedDateObj.dayOfWeek}, {selectedDateObj.dateFormatted}
                  </p>
                </div>
              )}

              {/* Time Slot */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  <Clock size={14} className="inline mr-1.5 text-blue-500" />
                  Time Slot
                </label>
                {selectedDate ? (
                  loadingAvailability ? (
                    <div className="h-11 bg-slate-100 rounded-xl animate-pulse" />
                  ) : (
                    <select
                      value={timeSlotId}
                      onChange={(e) => setTimeSlotId(e.target.value)}
                      className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-shadow"
                    >
                      <option value="">Choose a time</option>
                      {availableSlotsForSelectedDate.map((slot) => (
                        <option key={slot._id} value={slot._id}>
                          {slot.display}
                        </option>
                      ))}
                    </select>
                  )
                ) : (
                  <p className="text-sm text-slate-400 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                    Select a date first
                  </p>
                )}
                {selectedDate && !loadingAvailability && availableSlotsForSelectedDate.length === 0 && (
                  <p className="mt-2 text-xs text-amber-600 p-2 bg-amber-50 rounded-xl">
                    No slots available
                  </p>
                )}
              </div>

              {/* Form Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-900 mb-1">
                    Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="07X XXX XXXX"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-900 mb-1">
                    Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder="e.g., Headache, Follow-up"
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-900 mb-1">
                    Notes <span className="text-slate-400">(optional)</span>
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Additional info..."
                    className="w-full p-3 bg-white border border-slate-200 rounded-xl text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
              </div>

              {bookingError && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded-xl">
                  {bookingError}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={closeModal}
                  className="flex-1 py-3 border border-slate-200 rounded-full font-semibold text-slate-600 hover:bg-slate-50 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBook}
                  disabled={booking}
                  className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold rounded-full shadow-md shadow-blue-200 transition-all disabled:opacity-50 text-sm"
                >
                  {booking ? 'Booking...' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default BookAppointment;