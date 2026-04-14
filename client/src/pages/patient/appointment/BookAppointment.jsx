import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCookie } from '../../../utils/cookies';
import { Search, Calendar, Clock, Stethoscope, Video, MapPin } from 'lucide-react';

const GATEWAY = 'http://localhost:3000/api';

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

const getToken = () => getCookie('hb_access_token');

const BookAppointment = () => {
  const navigate = useNavigate();

  const [specialty, setSpecialty] = useState('');
  const [doctors, setDoctors] = useState([]);
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [appointmentType, setAppointmentType] = useState('online');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [timeSlot, setTimeSlot] = useState('');
  const [reason, setReason] = useState('');
  const [searching, setSearching] = useState(false);
  const [booking, setBooking] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [bookingError, setBookingError] = useState('');
  const [success, setSuccess] = useState(false);

  // ── Load ALL doctors on page load ─────────────────────
  useEffect(() => {
    loadDoctors('');
  }, []);

  const loadDoctors = async (specialization) => {
    setSearching(true);
    setSearchError('');
    setDoctors([]);
    setSelectedDoctor(null);

    try {
      const token = getToken();
      const query = specialization ? `?specialization=${specialization}` : '';
      const response = await axios.get(
        `${GATEWAY}/doctor/all${query}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const data = response.data?.data || response.data;
      const list = Array.isArray(data) ? data : [];

      if (list.length > 0) {
        setDoctors(list);
      } else {
        setSearchError('No verified doctors found.');
      }
    } catch (err) {
      setSearchError(
        err?.response?.data?.message || 'Failed to load doctors. Please try again.'
      );
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = () => {
    loadDoctors(specialty);
  };

  const handleViewAll = () => {
    setSpecialty('');
    loadDoctors('');
  };

  const handleBook = async () => {
    if (!selectedDoctor || !appointmentDate || !timeSlot) {
      setBookingError('Please fill in all required fields.');
      return;
    }
    setBooking(true);
    setBookingError('');

    try {
      const token = getToken();
      await axios.post(
        `${GATEWAY}/appointments/book`,
        {
          doctorId: selectedDoctor.userId,
          specialty: selectedDoctor.specialization,
          appointmentType,
          appointmentDate,
          timeSlot,
          reason,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      setTimeout(() => navigate('/patient/appointment/my'), 2000);
    } catch (err) {
      setBookingError(
        err?.response?.data?.message || 'Booking failed. Please try again.'
      );
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
        <p className="mt-2 text-slate-600">Redirecting to your appointments...</p>
      </div>
    );
  }

  return (
    <section className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-black text-slate-900">Book an Appointment</h1>
      <p className="mt-2 text-slate-600">Search for a doctor by specialty and book your visit.</p>

      {/* Step 1 */}
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
            <option value="">-- All Specialties --</option>
            {specialties.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button
            onClick={handleSearch}
            disabled={searching}
            className="flex items-center gap-2 rounded-xl bg-blue-700 px-5 py-2.5 text-white font-semibold hover:bg-blue-800 disabled:opacity-50"
          >
            <Search size={16} />
            {searching ? 'Searching...' : 'Search'}
          </button>
          <button
            onClick={handleViewAll}
            disabled={searching}
            className="rounded-xl border border-slate-200 px-5 py-2.5 text-slate-700 font-semibold hover:bg-slate-50 disabled:opacity-50"
          >
            View All
          </button>
        </div>
        {searchError && (
          <p className="mt-3 text-sm text-red-600">{searchError}</p>
        )}
        {searching && (
          <p className="mt-3 text-sm text-slate-500">Loading doctors...</p>
        )}
      </div>

      {/* Step 2 — Doctor list */}
      {doctors.length > 0 && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-1 flex items-center gap-2">
            <Search size={20} className="text-blue-700" />
            Step 2 — Select a Doctor
          </h2>
          <p className="text-sm text-slate-500 mb-4">
            {doctors.length} doctor{doctors.length > 1 ? 's' : ''} available
          </p>
          <div className="grid gap-3">
            {doctors.map((doc) => (
              <div
                key={doc._id}
                onClick={() => setSelectedDoctor(doc)}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                  selectedDoctor?._id === doc._id
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-blue-300'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-slate-900">
                      {doc.specialization || 'General'}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {doc.experienceYears} years experience
                    </p>
                    {doc.bio && (
                      <p className="text-sm text-slate-500 mt-1">{doc.bio}</p>
                    )}
                    {doc.qualifications?.length > 0 && (
                      <p className="text-xs text-slate-400 mt-1">
                        {doc.qualifications.join(', ')}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-700">
                      LKR {doc.consultationFee}
                    </p>
                    <p className="text-xs text-slate-400">per session</p>
                    {selectedDoctor?._id === doc._id && (
                      <span className="mt-1 inline-block rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">
                        Selected
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3 — Appointment Details */}
      {selectedDoctor && (
        <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Calendar size={20} className="text-blue-700" />
            Step 3 — Appointment Details
          </h2>

          <div className="mb-5 rounded-xl bg-blue-50 border border-blue-100 p-3">
            <p className="text-sm font-semibold text-blue-800">
              Booking with: {selectedDoctor.specialization} Specialist
            </p>
            <p className="text-xs text-blue-600 mt-0.5">
              Fee: LKR {selectedDoctor.consultationFee}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Appointment Type
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setAppointmentType('online')}
                className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 font-semibold transition-all ${
                  appointmentType === 'online'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                <Video size={16} /> Online
              </button>
              <button
                onClick={() => setAppointmentType('physical')}
                className={`flex items-center gap-2 rounded-xl border-2 px-4 py-2.5 font-semibold transition-all ${
                  appointmentType === 'physical'
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-slate-200 text-slate-600 hover:border-blue-300'
                }`}
              >
                <MapPin size={16} /> Physical
              </button>
            </div>
          </div>

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
              <option value="">-- Select a time slot --</option>
              {timeSlots.map((slot) => (
                <option key={slot} value={slot}>{slot}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">
              Reason for Visit
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe your symptoms or reason..."
              rows={3}
              className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          {bookingError && (
            <p className="mb-4 text-sm text-red-600">{bookingError}</p>
          )}

          <button
            onClick={handleBook}
            disabled={booking}
            className="w-full rounded-xl bg-blue-700 py-3 text-white font-bold hover:bg-blue-800 disabled:opacity-50 transition-all"
          >
            {booking ? 'Booking...' : 'Confirm Appointment'}
          </button>
        </div>
      )}
    </section>
  );
};

export default BookAppointment;
