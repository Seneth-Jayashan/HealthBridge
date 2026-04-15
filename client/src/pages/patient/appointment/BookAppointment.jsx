import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, Stethoscope, Video, MapPin, User } from 'lucide-react';
import { getAllDoctorsRequest, bookAppointmentRequest } from '../../../services/appointment.service';

const specialties = [
  'Cardiology', 'Neurology', 'Dermatology', 'Orthopedics',
  'Pediatrics', 'Psychiatry', 'Gynecology', 'Ophthalmology',
  'Dentistry', 'General Medicine'
];

const timeSlots = [
  '09:00 AM - 09:30 AM', '09:30 AM - 10:00 AM',
  '10:00 AM - 10:30 AM', '10:30 AM - 11:00 AM',
  '11:00 AM - 11:30 AM', '11:30 AM - 12:00 PM',
  '02:00 PM - 02:30 PM', '02:30 PM - 03:00 PM',
  '03:00 PM - 03:30 PM', '03:30 PM - 04:00 PM',
];

const BookAppointment = () => {
  const navigate = useNavigate();

  const [specialty, setSpecialty]             = useState('');
  const [doctors, setDoctors]                 = useState([]);
  const [selectedDoctor, setSelectedDoctor]   = useState(null);
  const [appointmentType, setAppointmentType] = useState('online');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlot, setTimeSlot]               = useState('');
  const [reason, setReason]                   = useState('');
  const [searching, setSearching]             = useState(false);
  const [booking, setBooking]                 = useState(false);
  const [searchError, setSearchError]         = useState('');
  const [bookingError, setBookingError]       = useState('');
  const [success, setSuccess]                 = useState(false);

  useEffect(() => { loadDoctors(''); }, []);

  const loadDoctors = async (specialization) => {
    setSearching(true);
    setSearchError('');
    setDoctors([]);
    setSelectedDoctor(null);
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

  const handleSearch  = () => loadDoctors(specialty);
  const handleViewAll = () => { setSpecialty(''); loadDoctors(''); };

  const handleBook = async () => {
    if (!selectedDoctor || !appointmentDate || !timeSlot) {
      setBookingError('Please select a doctor, date, and time slot.');
      return;
    }
    setBooking(true);
    setBookingError('');
    try {
      await bookAppointmentRequest({
        doctorId:        selectedDoctor.userId?._id || selectedDoctor.userId,
        specialty:       selectedDoctor.specialization,
        appointmentType,
        appointmentDate,
        timeSlot,
        reason,
      });
      setSuccess(true);
      setTimeout(() => navigate('/patient/appointment/my'), 2000);
    } catch (err) {
      setBookingError(err?.response?.data?.message || 'Booking failed. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  /* ── Success screen ─────────────────────────────── */
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

  /* ── Main UI ────────────────────────────────────── */
  return (
    <section className="max-w-3xl mx-auto pb-16">
      <h1 className="text-3xl font-black text-slate-900">Book an Appointment</h1>
      <p className="mt-2 text-slate-500">Search for a doctor by specialty and book your visit.</p>

      {/* ── Step 1 — Find a Doctor ───────────────────── */}
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
            {specialties.map((s) => <option key={s} value={s}>{s}</option>)}
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

        {searching && (
          <div className="mt-4 flex items-center gap-2 text-sm text-slate-500">
            <div className="h-4 w-4 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
            Loading doctors…
          </div>
        )}
        {searchError && <p className="mt-3 text-sm text-red-600">{searchError}</p>}
      </div>

      {/* ── Step 2 — Select a Doctor ─────────────────── */}
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
                  onClick={() => setSelectedDoctor(doc)}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    isSelected
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center">
                          <User size={16} className="text-blue-700" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">
                            Dr. {doc.userId?.name || doc.name || 'Unknown'}
                          </p>
                          <p className="text-sm font-medium text-blue-600">
                            {doc.specialization || 'General Medicine'}
                          </p>
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-sm text-slate-500">
                        {doc.experienceYears && (
                          <span>{doc.experienceYears} yrs experience</span>
                        )}
                        {doc.qualifications?.length > 0 && (
                          <span className="text-slate-400">{doc.qualifications.join(', ')}</span>
                        )}
                      </div>
                      {doc.bio && (
                        <p className="mt-1 text-sm text-slate-500 line-clamp-2">{doc.bio}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold text-blue-700 text-lg">LKR {doc.consultationFee}</p>
                      <p className="text-xs text-slate-400">per session</p>
                      {isSelected && (
                        <span className="mt-1 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                          ✓ Selected
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Step 3 — Appointment Details ─────────────── */}
      {selectedDoctor && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-700" />
            Step 3 — Appointment Details
          </h2>

          {/* Selected doctor summary */}
          <div className="mb-5 rounded-xl bg-blue-50 border border-blue-100 p-4 flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-blue-800">
                Dr. {selectedDoctor.userId?.name || selectedDoctor.name || 'Unknown'}
              </p>
              <p className="text-xs text-blue-600 mt-0.5">{selectedDoctor.specialization}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold text-blue-700">LKR {selectedDoctor.consultationFee}</p>
              <button
                onClick={() => setSelectedDoctor(null)}
                className="text-xs text-slate-400 hover:text-red-500 mt-0.5 transition-colors"
              >
                Change doctor
              </button>
            </div>
          </div>

          {/* Appointment Type */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Appointment Type
            </label>
            <div className="flex gap-3">
              {[
                { value: 'online',   icon: <Video size={15} />,  label: 'Online'   },
                { value: 'physical', icon: <MapPin size={15} />, label: 'Physical' },
              ].map(({ value, icon, label }) => (
                <button
                  key={value}
                  onClick={() => setAppointmentType(value)}
                  className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 font-semibold transition-all ${
                    appointmentType === value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {icon}{label}
                </button>
              ))}
            </div>
          </div>

          {/* Date */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Appointment Date
            </label>
            <input
              type="date"
              value={appointmentDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Time Slot */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              <Clock size={14} className="inline mr-1" />
              Time Slot
            </label>
            <select
              value={timeSlot}
              onChange={(e) => setTimeSlot(e.target.value)}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">— Select a time slot —</option>
              {timeSlots.map((slot) => <option key={slot} value={slot}>{slot}</option>)}
            </select>
          </div>

          {/* Reason */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason for Visit <span className="font-normal text-slate-400">(optional)</span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe your symptoms or reason…"
              rows={3}
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
            className="w-full rounded-xl bg-blue-700 py-3 text-white font-bold hover:bg-blue-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            {booking ? (
              <>
                <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Booking…
              </>
            ) : (
              'Confirm Appointment'
            )}
          </button>
        </div>
      )}
    </section>
  );
};

export default BookAppointment;