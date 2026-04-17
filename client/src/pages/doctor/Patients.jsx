import React, { useEffect, useState } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import { 
  getPatientListForDoctor, 
  removePatientFromDoctorList 
} from '../../services/doctor.service';
import { 
  Users, 
  Search, 
  Mail, 
  Phone, 
  Calendar, 
  Loader2, 
  AlertCircle,
  UserRound,
  Eye,
  FileSignature,
  UserMinus
} from 'lucide-react';

import PatientDetailsModal from '../../components/patients/PatientDetailsModal';

const Patients = () => {
  const { isDark = false } = useOutletContext() || {};
  const navigate = useNavigate();
  
  const [patients, setPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  
  // State to handle the loading spinner on a specific patient being removed
  const [removingId, setRemovingId] = useState(null);

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setIsLoading(true);
        const data = await getPatientListForDoctor();
        
        let extractedPatients = [];
        if (Array.isArray(data)) {
          extractedPatients = data.flatMap(doc => doc.patients || []);
        } else if (data && data.patients) {
          extractedPatients = data.patients; 
        }
        
        // --- Deduplicate patients by patientId ---
        const uniquePatients = Array.from(
          new Map(extractedPatients.map(p => [p.patientId, p])).values()
        );
        
        setPatients(uniquePatients); 
      } catch (err) {
        console.error("Failed to fetch patients:", err);
        setError("Unable to load your patient list. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPatients();
  }, []);

  useEffect(() => {
    if (!isLoading && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animate('.hb-patient-item', {
        y: [20, 0],
        opacity: [0, 1],
        ease: 'outCubic',
        duration: 800,
        delay: stagger(50)
      });
    }
  }, [isLoading, searchTerm]); 

  // --- Action Handlers ---

  const handleViewAccount = (patientId) => {
    setSelectedPatientId(patientId);
    setIsModalOpen(true);
  };

  const handleAddPrescription = (patientId) => {
    navigate(`/doctor/prescriptions/new?patientId=${patientId}`);
  };

  const handleRemovePatient = async (patientId, patientName) => {
    if (!window.confirm(`Are you sure you want to remove ${patientName} from your patient list?`)) return;
    
    try {
      setRemovingId(patientId);
      await removePatientFromDoctorList(patientId);
      
      setPatients(prevPatients => prevPatients.filter(p => p.patientId !== patientId));
    } catch (err) {
      console.error("Failed to remove patient:", err);
      alert(err.response?.data?.message || "Failed to remove patient. Please try again.");
    } finally {
      setRemovingId(null);
    }
  };

  // --- Filtering & Helpers ---

  const filteredPatients = patients.filter(patient => 
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.phoneNumber?.includes(searchTerm)
  );

  console.log('Filtered Patients:', filteredPatients);

  // --- UPDATED: Calculate and format the exact appointment date ---
  const getDisplayDate = (appointmentData) => {
    if (!appointmentData || !appointmentData.createdAt || !appointmentData.dayOfWeek) {
      return 'No previous appointments';
    }

    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const targetDayIndex = daysOfWeek.indexOf(appointmentData.dayOfWeek);
    const createdDate = new Date(appointmentData.createdAt);
    const createdDayIndex = createdDate.getDay();

    let daysToAdd = targetDayIndex - createdDayIndex;
    if (daysToAdd < 0) {
      daysToAdd += 7;
    }

    const appointmentDate = new Date(createdDate);
    appointmentDate.setDate(createdDate.getDate() + daysToAdd);

    return appointmentDate.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getInitials = (name) => {
    if (!name) return 'PT';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  if (isLoading) {
    return (
      <div className={`min-h-[60vh] flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-[#0B1120]' : 'bg-[#FAFAFA]'}`}>
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading patient records...</p>
      </div>
    );
  }

  return (
    <section className={`min-h-screen p-6 md:p-10 font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#FAFAFA] text-slate-900'}`}>
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header & Search */}
        <div className="hb-patient-item opacity-0 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className={`text-3xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Users className="text-blue-500" size={32} />
              My Patients
            </h1>
            <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              View and manage the records of patients who have consulted with you.
            </p>
          </div>

          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search size={18} className={isDark ? 'text-slate-500' : 'text-slate-400'} />
            </div>
            <input
              type="text"
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full pl-11 pr-4 py-3 rounded-2xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm ${
                isDark 
                  ? 'bg-[#131C31] border-slate-800 text-white placeholder-slate-500' 
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            />
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="hb-patient-item opacity-0 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 font-bold">
            <AlertCircle size={24} />
            <p>{error}</p>
          </div>
        )}

        {/* Patient List */}
        {!error && (
          <div className="space-y-4">
            {patients.length === 0 ? (
              <div className={`hb-patient-item opacity-0 p-12 flex flex-col items-center justify-center text-center rounded-3xl border border-dashed ${isDark ? 'bg-[#131C31]/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`p-4 rounded-full mb-4 ${isDark ? 'bg-slate-800' : 'bg-white shadow-sm'}`}>
                  <UserRound size={32} className="text-slate-400" />
                </div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-800'}`}>No patients yet</h3>
                <p className={`max-w-md ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Patients will appear here automatically once they book and complete an appointment with you.
                </p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="hb-patient-item opacity-0 p-12 text-center">
                <p className={`font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>No patients found matching "{searchTerm}"</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredPatients.map((patient, index) => (
                  <div 
                    key={patient.patientId || index} 
                    className={`hb-patient-item opacity-0 flex flex-col sm:flex-row sm:items-center gap-5 p-5 rounded-2xl border transition-all shadow-sm ${
                      isDark 
                        ? 'bg-[#131C31] border-slate-800 shadow-black/20' 
                        : 'bg-white border-slate-100'
                    }`}
                  >
                    {/* Avatar */}
                    <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-xl font-black text-white shadow-inner">
                      {getInitials(patient.name)}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-bold truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        {patient.name}
                      </h3>
                      
                      <div className="mt-1 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                        <div className={`flex items-center gap-1.5 text-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <Mail size={14} className="flex-shrink-0" />
                          <span className="truncate">{patient.email}</span>
                        </div>
                        <div className={`flex items-center gap-1.5 text-sm truncate ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          <Phone size={14} className="flex-shrink-0" />
                          <span>{patient.phoneNumber}</span>
                        </div>
                      </div>

                      {/* UPDATED JSX CALL */}
                      <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-opacity-10 border-opacity-20 bg-blue-500 text-blue-500 border-blue-500">
                        <Calendar size={12} />
                        Last Visit: {getDisplayDate(patient.lastAppointmentData)}
                      </div>
                    </div>

                    {/* Quick Actions Array */}
                    <div className="mt-4 sm:mt-0 flex items-center gap-2 border-t sm:border-t-0 sm:border-l pt-4 sm:pt-0 sm:pl-4 border-slate-200 dark:border-slate-800">
                      
                      {/* View Account */}
                      <button 
                        onClick={() => handleViewAccount(patient.patientId)}
                        title="View Patient Account"
                        className={`p-2.5 rounded-xl transition-colors ${
                          isDark 
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white' 
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                        }`}
                      >
                        <Eye size={18} />
                      </button>

                      {/* Add Prescription */}
                      <button 
                        onClick={() => handleAddPrescription(patient.patientId)}
                        title="Add Prescription"
                        className={`p-2.5 rounded-xl transition-colors ${
                          isDark 
                            ? 'bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 hover:text-blue-300' 
                            : 'bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700'
                        }`}
                      >
                        <FileSignature size={18} />
                      </button>

                      {/* Remove Patient */}
                      <button 
                        onClick={() => handleRemovePatient(patient.patientId, patient.name)}
                        title="Remove from List"
                        disabled={removingId === patient.patientId}
                        className={`p-2.5 rounded-xl transition-colors disabled:opacity-50 ${
                          isDark 
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300' 
                            : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'
                        }`}
                      >
                        {removingId === patient.patientId ? (
                          <Loader2 size={18} className="animate-spin" />
                        ) : (
                          <UserMinus size={18} />
                        )}
                      </button>
                      
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <PatientDetailsModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        patientId={selectedPatientId}
        isDark={isDark}
      />
    </section>
  );
};

export default Patients;