import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, Stethoscope, User, Video } from 'lucide-react';
import {
  getAllDoctorsRequest,
  bookAppointmentRequest
} from '../../../services/appointment.service';
import { getDoctorByIdForPatient } from '../../../services/patient.service';

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
  'General Medicine'
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

const BookAppointment = () => {
  const navigate = useNavigate();

  const [specialty, setSpecialty] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  const [doctorAvailability, setDoctorAvailability] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  const [selectedDate, setSelectedDate] = useState(''); // YYYY-MM-DD
  const [timeSlot, setTimeSlot] = useState('');
  const [reason, setReason] = useState('');
  const [notes, setNotes] = useState('');

  const [searching, setSearching] = useState(false);
  const [booking, setBooking] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [success, setSuccess] = useState(false);

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
    setTimeSlot('');
    try {
      const list = await getAllDoctorsRequest(specialization);
      if (list.length > 0) {
        setDoctors(list);
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
    setTimeSlot('');
    setDoctorAvailability([]);
    setBookingError('');

    try {
      setLoadingAvailability(true);
      const doctorId = doc?._id;
      const doctorDetails = await getDoctorByIdForPatient(doctorId); // must include availability[]
      setDoctorAvailability(doctorDetails?.availability || []);
    } catch (err) {
      setDoctorAvailability([]);
      setBookingError(err?.response?.data?.message || 'Failed to load doctor availability');
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Current week Monday -> Sunday
  const getWeekDaysWithDates = () => {
    const today = new Date();
    const currentDay = today.getDay(); // Sun=0
    const monday = new Date(today);
    const diff = today.getDate() - currentDay + (currentDay === 0 ? -6 : 1);
    monday.setDate(diff);

    const week = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);

      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const dd = String(date.getDate()).padStart(2, '0');

      week.push({
        dayOfWeek: dayNames[date.getDay()],
        date: `${yyyy}-${mm}-${dd}`,
        dateFormatted: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
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
        startTime: slot.startTime,
        endTime: slot.endTime,
        display: formatForUiSlot(slot.startTime, slot.endTime),
        apiFormat: `${slot.startTime}-${slot.endTime}`
      }));
  }, [selectedDayOfWeek, doctorAvailability]);

  const handleBook = async () => {
    if (!selectedDoctor || !selectedDate || !timeSlot) {
      setBookingError('Please select a doctor, date, and available time slot.');
      return;
    }

    setBooking(true);
    setBookingError('');

    try {
      await bookAppointmentRequest({
        doctorId: selectedDoctor._id,
        specialty: selectedDoctor.specialization || specialty, // ✅ Include specialty
        appointmentDate: selectedDate, // ✅ real selected date (YYYY-MM-DD)
        dayOfWeek: selectedDayOfWeek, // ✅ Include day of week
        appointmentType: 'online', // ✅ Explicitly set to online
        timeSlot, // ✅ HH:mm-HH:mm format
        reason,
        notes
      });

      setSuccess(true);
      setTimeout(() => navigate('/patient/appointment/my'), 1600);
    } catch (err) {
      setBookingError(err?.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-24">
        <div className="rounded-full bg-green-100 p-6 mb-4">
          <Calendar size={40} className="text-green-600" />
        </div>
        <h2 className="text-2xl font-black text-slate-900">Appointment Booked!</h2>
        <p className="mt-2 text-slate-600">Redirecting to your appointments…</p>
      </div>
    );
  }

  return (
    <section className="max-w-3xl mx-auto pb-16">
      <h1 className="text-3xl font-black text-slate-900">Book an Appointment</h1>
      <p className="mt-2 text-slate-500">Search for a doctor and book an online appointment.</p>

      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
          <Stethoscope size={20} className="text-blue-700" />
          Step 1 — Find a Doctor
        </h2>
        <div className="flex gap-3">
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">— All Specialties —</option>
            {specialties.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-white font-semibold hover:bg-blue-800 disabled:opacity-50 transition-all"
          >
            <Search size={16} />
            {searching ? 'Searching…' : 'Search'}
          </button>

          <button
            onClick={handleViewAll}
            disabled={searching}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50 transition-all"
          >
            View All
          </button>
        </div>

        {searchError && <p className="mt-3 text-sm text-red-600">{searchError}</p>}
      </div>

      {doctors.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            <User size={20} className="text-blue-700" />
            Step 2 — Select a Doctor
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            {doctors.length} doctor{doctors.length !== 1 ? 's' : ''} found
          </p>

          <div className="grid gap-3">
            {doctors.map((doc) => {
              const isSelected = selectedDoctor?._id === doc._id;
              return (
                <div
                  key={doc._id}
                  onClick={() => handleSelectDoctor(doc)}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900">
                        Dr. {doc.userId?.name || doc.name || 'Unknown'}
                      </p>
                      <p className="text-sm font-medium text-blue-600">
                        {doc.specialization || 'General Medicine'}
                      </p>
                    </div>
                    <p className="font-bold text-blue-700">LKR {doc.consultationFee}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {selectedDoctor && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-700" />
            Step 3 — Appointment Details
          </h2>

          <div className="mb-5 rounded-xl bg-blue-50 border border-blue-100 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-800">
                Dr. {selectedDoctor.userId?.name || selectedDoctor.name || 'Unknown'}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">{selectedDoctor.specialization}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-blue-700">LKR {selectedDoctor.consultationFee}</p>
              <p className="text-xs text-blue-600 flex items-center gap-1 justify-end mt-1">
                <Video size={12} /> Online Only
              </p>
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-3">
              <Calendar size={14} className="inline mr-1" />
              Select Date (Current Week)
            </label>

            {loadingAvailability ? (
              <p className="text-sm text-slate-500">Loading available days...</p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-7">
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
                        setTimeSlot('');
                      }}
                      disabled={!hasSlots}
                      className={`rounded-lg py-3 px-2 text-center transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white ring-2 ring-blue-400'
                          : hasSlots
                          ? 'border border-slate-300 bg-white text-slate-700 hover:border-blue-400 hover:bg-blue-50'
                          : 'border border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                    >
                      <div className="text-xs font-semibold">{dayData.dayOfWeek.slice(0, 3)}</div>
                      <div className="text-sm font-bold">{dayData.dateFormatted}</div>
                    </button>
                  );
                })}
              </div>
            )}

            {!loadingAvailability && doctorAvailability.length === 0 && (
              <p className="mt-2 text-sm text-amber-600">Doctor has no availability configured.</p>
            )}
          </div>

          {selectedDateObj && (
            <div className="mb-6 rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-4">
              <p className="text-sm text-blue-600 font-semibold mb-1">Selected Date</p>
              <p className="text-xl font-bold text-blue-900">
                {selectedDateObj.dayOfWeek}, {selectedDateObj.dateFormatted}
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Clock size={14} className="inline mr-1" />
              Available Time Slots
            </label>

            {selectedDate ? (
              <>
                {loadingAvailability ? (
                  <p className="text-sm text-slate-500">Loading available slots...</p>
                ) : (
                  <select
                    value={timeSlot}
                    onChange={(e) => setTimeSlot(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">— Select an available time slot —</option>
                    {availableSlotsForSelectedDate.map((slot) => (
                      <option key={slot.apiFormat} value={slot.apiFormat}>
                        {slot.display}
                      </option>
                    ))}
                  </select>
                )}

                {!loadingAvailability && availableSlotsForSelectedDate.length === 0 && (
                  <p className="mt-2 text-sm text-amber-600">
                    No available slots for {selectedDateObj?.dayOfWeek}.
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-slate-500">Select a date to see available time slots.</p>
            )}
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason for Visit <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Additional Notes <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {bookingError && (
            <div className="mb-4 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              {bookingError}
            </div>
          )}

          <button
            onClick={handleBook}
            disabled={booking}
            className="w-full rounded-xl bg-blue-700 py-3 text-white font-bold hover:bg-blue-800 disabled:opacity-50 transition-all"
          >
            {booking ? 'Booking…' : 'Confirm Appointment'}
          </button>
        </div>
      )}
    </section>
  );
};

export default BookAppointment;