import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Star, Clock, Stethoscope } from 'lucide-react';
import httpClient from '../../../api/Axios';

// ── Update this to match your doctor service endpoint ─────────────────────
const DOCTOR_SEARCH_PATH = '/doctors';
// ─────────────────────────────────────────────────────────────────────────

const SPECIALTIES = [
  'All', 'Cardiology', 'Dermatology', 'Neurology',
  'Orthopedics', 'Pediatrics', 'Psychiatry', 'Radiology', 'General Practice',
];

const fetchDoctors = async (specialty) => {
  const query = specialty && specialty !== 'All' ? `?specialty=${specialty}` : '';
  const res = await httpClient.get(`${DOCTOR_SEARCH_PATH}${query}`);
  return res.data?.data || res.data?.doctors || res.data?.users || res.data || [];
};

export default function BookAppointment() {
  const navigate = useNavigate();

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchName, setSearchName] = useState('');
  const [specialty, setSpecialty] = useState('All');

  useEffect(() => {
    loadDoctors();
  }, [specialty]);

  const loadDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchDoctors(specialty);
      setDoctors(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load doctors.');
    } finally {
      setLoading(false);
    }
  };

  const filtered = doctors.filter((doc) => {
    const name = `${doc.firstName || ''} ${doc.lastName || doc.name || ''}`.toLowerCase();
    return name.includes(searchName.toLowerCase());
  });

  const handleBook = (doctor) => {
    navigate('/patient/appointment/book/confirm', { state: { doctor } });
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-black text-slate-900">Book an Appointment</h1>
          <p className="text-sm text-slate-500 mt-1">Find a doctor and schedule your visit</p>
        </div>

        {/* Search + Filter bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search doctor by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="sm:w-56 border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          >
            {SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm mb-4">
            {error}
          </div>
        )}

        {/* Empty */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-20">
            <Stethoscope size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="font-bold text-slate-500">No doctors found</p>
            <p className="text-sm text-slate-400 mt-1">Try a different name or specialty</p>
          </div>
        )}

        {/* Doctor grid */}
        {!loading && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((doctor) => (
              <DoctorCard key={doctor._id} doctor={doctor} onBook={handleBook} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function DoctorCard({ doctor, onBook }) {
  const name = doctor.name ||
    `${doctor.firstName || ''} ${doctor.lastName || ''}`.trim() || 'Unknown Doctor';
  const specialty = doctor.specialty || doctor.specialization || 'General Practice';
  const photo = doctor.profilePhoto || doctor.avatar || doctor.photo || null;
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  const experience = doctor.experience || doctor.yearsOfExperience || null;
  const rating = doctor.rating || null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col gap-4 hover:shadow-md hover:border-blue-200 transition-all duration-200">
      {/* Avatar + info */}
      <div className="flex items-start gap-3">
        <div className="w-14 h-14 rounded-2xl flex-shrink-0 flex items-center justify-center bg-blue-100 text-blue-700 font-black text-lg overflow-hidden">
          {photo
            ? <img src={photo} alt={name} className="w-full h-full object-cover" />
            : initials
          }
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-slate-800 truncate text-sm">{name}</p>
          <span className="inline-block mt-1 text-xs font-semibold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
            {specialty}
          </span>
          <div className="flex items-center gap-3 mt-2">
            {rating && (
              <span className="flex items-center gap-1 text-xs text-amber-500 font-semibold">
                <Star size={11} fill="currentColor" /> {rating}
              </span>
            )}
            {experience && (
              <span className="flex items-center gap-1 text-xs text-slate-400">
                <Clock size={11} /> {experience} yrs
              </span>
            )}
          </div>
        </div>
      </div>

      <button
        onClick={() => onBook(doctor)}
        className="w-full mt-auto bg-blue-700 hover:bg-blue-800 active:scale-95 transition-all text-white text-sm font-bold py-2.5 rounded-xl shadow-sm shadow-blue-700/20"
      >
        Book Appointment
      </button>
    </div>
  );
}