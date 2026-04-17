import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, useOutletContext } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import { getPatientByIdForDoctor } from '../../services/doctor.service';
import { createPrescription } from '../../services/prescription.service';
import { 
  Pill, Plus, Trash2, Save, User, FileText, 
  Calendar, Clock, Loader2, AlertCircle, 
  ArrowLeft, CheckCircle2, ClipboardPen
} from 'lucide-react';
import { getPatientById } from '../../services/user.service';

const CreatePrescription = () => {
  const { isDark = false } = useOutletContext() || {};
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const patientId = searchParams.get('patientId');

  // Core State
  const [patient, setPatient] = useState(null);
  const [isLoadingPatient, setIsLoadingPatient] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  // RxNav API State
  const [allMedicines, setAllMedicines] = useState([]);
  const [focusedMedIndex, setFocusedMedIndex] = useState(null);

  // Form State (Aligned with Mongoose Schema)
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [medication, setMedication] = useState([
    { medicineName: '', dosage: '', frequency: '', duration: '' }
  ]);

// 1. Fetch Patient Details
  useEffect(() => {
    const fetchPatient = async () => {
      if (!patientId) {
        setError("No patient selected. Please go back and select a patient.");
        setIsLoadingPatient(false);
        return;
      }
      
      try {
        // 1. Fetch the medical profile
        const medicalData = await getPatientByIdForDoctor(patientId);
        
        if (!medicalData) throw new Error("Patient not found");

        // 2. Fetch the base user profile (Name, Email, Phone)
        const baseUserData = await getPatientById(medicalData.userId).catch((err) => {
          console.error("Failed to load base user data:", err);
          return {}; // Return empty object as fallback
        });

        // 3. Merge them into one unified data set
        const unifiedPatient = {
          ...medicalData,
          name: baseUserData.name || medicalData.name || 'Unknown',
          email: baseUserData.email || medicalData.email || 'N/A',
          phoneNumber: baseUserData.phoneNumber || medicalData.phoneNumber || 'N/A'
        };

        // 4. Save the single unified object to state
        setPatient(unifiedPatient);
        
      } catch (err) {
        console.error("Failed to load patient:", err);
        setError("Unable to load patient details.");
      } finally {
        setIsLoadingPatient(false);
      }
    };
    
    fetchPatient();
  }, [patientId]);

  // 2. Fetch RxNav Medication Dictionary
  useEffect(() => {
    const fetchMedicines = async () => {
      try {
        const response = await fetch('https://rxnav.nlm.nih.gov/REST/displaynames.json');
        const data = await response.json();
        if (data && data.displayTermsList && data.displayTermsList.term) {
          setAllMedicines(data.displayTermsList.term);
        }
      } catch (err) {
        console.error("Failed to fetch medicine dictionary:", err);
      }
    };
    fetchMedicines();
  }, []);

  // 3. Initial Animation
  useEffect(() => {
    if (!isLoadingPatient && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animate('.hb-presc-item', {
        y: [20, 0],
        opacity: [0, 1],
        ease: 'outCubic',
        duration: 800,
        delay: stagger(100)
      });
    }
  }, [isLoadingPatient]);

  // --- Handlers ---

  const handleAddMedication = () => {
    setMedication([...medication, { medicineName: '', dosage: '', frequency: '', duration: '' }]);
  };

  const handleRemoveMedication = (index) => {
    const updated = [...medication];
    updated.splice(index, 1);
    setMedication(updated);
  };

  const handleMedicationChange = (index, field, value) => {
    const updated = [...medication];
    updated[index][field] = value;
    setMedication(updated);
  };

  const handleSelectMedicine = (index, name) => {
    handleMedicationChange(index, 'medicineName', name);
    setFocusedMedIndex(null); // Close dropdown
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    // Filter out completely empty rows
    const validMedications = medication.filter(m => m.medicineName.trim() !== '');
    
    if (validMedications.length === 0) {
      setError("Please add at least one valid medication.");
      setIsSubmitting(false);
      return;
    }

    try {
      // Build payload exactly matching the Mongoose schema
      const payload = {
        patientId,
        medication: validMedications,
        notes: notes.trim(),
        startDate,
        endDate
      };

      await createPrescription(payload);
      setSuccess(true);
      
      // Redirect back after success
      setTimeout(() => {
        navigate('/doctor/patients');
      }, 2000);
      
    } catch (err) {
      console.error("Failed to create prescription:", err);
      setError(err.response?.data?.message || "An error occurred while saving the prescription.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPatient) {
    return (
      <div className={`min-h-[60vh] flex flex-col items-center justify-center gap-3 ${isDark ? 'bg-[#0B1120]' : 'bg-[#FAFAFA]'}`}>
        <Loader2 className="animate-spin text-blue-600" size={32} />
        <p className={`font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Loading prescription workspace...</p>
      </div>
    );
  }

  return (
    <section className={`min-h-screen p-6 md:p-10 font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#FAFAFA] text-slate-900'}`}>
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header & Back Button */}
        <div className="hb-presc-item opacity-0 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button 
              onClick={() => navigate('/doctor/patients')}
              className={`mb-4 flex items-center gap-2 text-sm font-bold transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'}`}
            >
              <ArrowLeft size={16} /> Back to Patients
            </button>
            <h1 className={`text-3xl font-black flex items-center gap-3 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <FileText className="text-blue-500" size={32} />
              Write E-Prescription
            </h1>
            <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Digitally prescribe medications securely.
            </p>
          </div>
        </div>

        {error && (
          <div className="hb-presc-item opacity-0 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl text-red-500 font-bold">
            <AlertCircle size={24} /> <p>{error}</p>
          </div>
        )}

        {success ? (
          <div className={`hb-presc-item opacity-0 p-12 flex flex-col items-center justify-center text-center rounded-3xl border ${isDark ? 'bg-[#131C31] border-emerald-500/30' : 'bg-white border-emerald-200'}`}>
            <div className="p-4 rounded-full bg-emerald-500/20 text-emerald-500 mb-4">
              <CheckCircle2 size={48} />
            </div>
            <h3 className={`text-2xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Prescription Issued!</h3>
            <p className={`${isDark ? 'text-slate-400' : 'text-slate-500'}`}>The prescription has been securely saved to the patient's record. Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Context & Timeline Card */}
            <div className={`hb-presc-item opacity-0 p-6 md:p-8 rounded-3xl border flex flex-col lg:flex-row gap-8 ${isDark ? 'bg-slate-900/50 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              
              {/* Patient Summary */}
              {patient && (
                <div className="flex items-center gap-4 flex-1">
                  <div className={`p-4 rounded-full ${isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                    <User size={28} />
                  </div>
                  <div>
                    <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Prescribing to</p>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{patient.name || 'Unknown Patient'}</p>
                    <p className={`text-sm mt-1 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Patient ID: {patient.patientId || 'N/A'}</p>
                  </div>
                </div>
              )}

              {/* Timeline Inputs */}
              <div className={`flex-1 grid grid-cols-2 gap-4 lg:border-l lg:pl-8 ${isDark ? 'border-slate-800' : 'border-slate-200'}`}>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>Start Date</label>
                  <div className="relative">
                    <Calendar size={16} className={`absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      type="date"
                      required
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500 color-scheme-dark' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'}`}
                    />
                  </div>
                </div>
                <div>
                  <label className={`block text-xs font-bold uppercase tracking-wider mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>End Date</label>
                  <div className="relative">
                    <Calendar size={16} className={`absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                    <input
                      type="date"
                      required
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500 color-scheme-dark' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'}`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Medications List */}
            {/* Added relative z-20 so dropdowns flow over the next section */}
            <div className={`relative z-20 hb-presc-item opacity-0 p-6 md:p-8 rounded-3xl border shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
              
              <div className="flex items-center justify-between mb-6 border-b pb-4 dark:border-slate-800 border-slate-100">
                <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  <Pill className="text-blue-500" size={24} /> Prescribed Medications
                </h3>
                <button 
                  type="button" 
                  onClick={handleAddMedication}
                  className={`text-sm font-bold flex items-center gap-2 px-4 py-2 rounded-xl transition-colors shadow-sm ${isDark ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'}`}
                >
                  <Plus size={18} /> Add Medicine
                </button>
              </div>

              <div className="space-y-5">
                {medication.map((med, index) => (
                  // Added relative z-30 to the individual row
                  <div key={index} className={`relative z-30 p-5 rounded-2xl border transition-all ${isDark ? 'bg-slate-900/30 border-slate-700 focus-within:border-blue-500/50' : 'bg-slate-50 border-slate-200 focus-within:border-blue-400 focus-within:bg-white focus-within:shadow-md'}`}>
                    
                    {medication.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => handleRemoveMedication(index)}
                        className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:bg-red-500/10 hover:text-red-500 transition-colors z-10"
                        title="Remove Medication"
                      >
                        <Trash2 size={18} />
                      </button>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pr-10">
                      
                      {/* Medicine Name with RxNav Autocomplete */}
                      <div className="md:col-span-5 relative">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Medicine Name</label>
                        <input 
                          type="text" 
                          placeholder="e.g., Amoxicillin" 
                          value={med.medicineName} 
                          required
                          onChange={(e) => handleMedicationChange(index, 'medicineName', e.target.value)}
                          onFocus={() => setFocusedMedIndex(index)}
                          onBlur={() => setTimeout(() => setFocusedMedIndex(null), 200)} // Delay hides dropdown so clicks register
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'}`}
                        />
                        
                        {/* Auto-Complete Dropdown */}
                        {focusedMedIndex === index && med.medicineName.length > 1 && (
                          <div className={`absolute z-50 w-[120%] mt-1 rounded-xl border shadow-2xl max-h-60 overflow-y-auto ${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                            {allMedicines
                              .filter(m => m.toLowerCase().includes(med.medicineName.toLowerCase()))
                              .slice(0, 30) // Limit to top 30 for performance
                              .map((m, i) => (
                                <div 
                                  key={i} 
                                  onClick={() => handleSelectMedicine(index, m)}
                                  className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${isDark ? 'text-slate-300 hover:bg-blue-600 hover:text-white' : 'text-slate-700 hover:bg-blue-50 hover:text-blue-700'}`}
                                >
                                  {m}
                                </div>
                              ))}
                            {allMedicines.filter(m => m.toLowerCase().includes(med.medicineName.toLowerCase())).length === 0 && (
                               <div className={`px-4 py-3 text-sm italic ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>No matches found</div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Dosage */}
                      <div className="md:col-span-2 relative z-0">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Dosage</label>
                        <input 
                          type="text" 
                          placeholder="e.g., 500mg" 
                          value={med.dosage} 
                          required
                          onChange={(e) => handleMedicationChange(index, 'dosage', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'}`}
                        />
                      </div>

                      {/* Frequency */}
                      <div className="md:col-span-3 relative z-0">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Frequency</label>
                        <input 
                          type="text" 
                          placeholder="e.g., Twice a day" 
                          value={med.frequency} 
                          required
                          onChange={(e) => handleMedicationChange(index, 'frequency', e.target.value)}
                          className={`w-full px-4 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'}`}
                        />
                      </div>

                      {/* Duration */}
                      <div className="md:col-span-2 relative z-0">
                        <label className={`block text-xs font-bold uppercase tracking-wider mb-1.5 ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>Duration</label>
                        <div className="relative">
                          <Clock size={16} className={`absolute left-3 top-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                          <input 
                            type="text" 
                            placeholder="5 Days" 
                            value={med.duration} 
                            required
                            onChange={(e) => handleMedicationChange(index, 'duration', e.target.value)}
                            className={`w-full pl-10 pr-3 py-2.5 rounded-xl border text-sm font-medium outline-none transition-colors ${isDark ? 'bg-slate-800 border-slate-700 text-white focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500'}`}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Doctor's Notes */}
            {/* Added relative z-0 so it stays securely beneath the dropdown */}
            <div className={`relative z-0 hb-presc-item opacity-0 p-6 md:p-8 rounded-3xl border shadow-lg ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/20' : 'bg-white border-slate-100 shadow-blue-900/5'}`}>
              <h3 className={`text-lg font-bold flex items-center gap-2 mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                <ClipboardPen className="text-blue-500" size={20} /> Clinical Notes
              </h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={4}
                placeholder="Include diagnosis details, general advice, dietary restrictions, or follow-up instructions here..."
                className={`w-full px-4 py-4 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors resize-none ${isDark ? 'bg-slate-900/50 border-slate-700 text-white placeholder-slate-600' : 'bg-slate-50 border-slate-200 text-slate-900'}`}
              />
            </div>

            {/* Action Buttons */}
            <div className="hb-presc-item opacity-0 flex items-center justify-end gap-4 pt-2 relative z-0">
              <button 
                type="button"
                onClick={() => navigate('/doctor/patients')}
                className={`px-8 py-3.5 rounded-xl font-bold transition-colors ${isDark ? 'bg-slate-800 text-white hover:bg-slate-700' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'}`}
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSubmitting}
                className="px-10 py-3.5 rounded-xl font-bold flex items-center gap-2 bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? <Loader2 size={20} className="animate-spin" /> : <Save size={20} />}
                {isSubmitting ? 'Saving to Records...' : 'Issue Prescription'}
              </button>
            </div>

          </form>
        )}
      </div>
    </section>
  );
};

export default CreatePrescription;