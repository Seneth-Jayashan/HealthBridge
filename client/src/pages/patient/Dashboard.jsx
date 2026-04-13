import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { 
  CalendarDays, 
  HeartPulse, 
  MessageSquare, 
  Pill, 
  AlertCircle, 
  Save, 
  User 
} from 'lucide-react';
// Make sure to import your service functions!
import { 
  getPatientDashboard, 
  getIsProfileUpdated, 
  updatePatientProfile 
} from '../../services/patient.service'; // Adjust path if needed

const fallbackMetrics = [
  { label: 'Upcoming Appointments', value: '0', icon: CalendarDays },
  { label: 'Unread Care Messages', value: '0', icon: MessageSquare },
  { label: 'Active Prescriptions', value: '0', icon: Pill },
  { label: 'Health Score', value: '--', icon: HeartPulse },
];

const PatientDashboard = () => {
  const { isDark = false } = useOutletContext() || {};
  
  const [metrics, setMetrics] = useState(fallbackMetrics);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Quick Setup Form Data
  const [formData, setFormData] = useState({
    dateOfBirth: '',
    gender: 'Prefer not to say',
    contactNumber: '',
    address: '',
    emergencyName: '',
    emergencyPhone: ''
  });

  useEffect(() => {
    const initializeDashboard = async () => {
      try {
        // 1. Check if the profile needs to be updated
        const statusData = await getIsProfileUpdated();
        if (statusData && statusData.isUpdated === false) {
          setShowProfileModal(true);
        }

        // 2. Load Dashboard Metrics
        const dashData = await getPatientDashboard();
        if (Array.isArray(dashData?.metrics) && dashData.metrics.length > 0) {
          setMetrics(dashData.metrics);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeDashboard();
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCompleteProfile = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Map the flat form data back to the nested Mongoose schema structure
      const payload = {
        dateOfBirth: formData.dateOfBirth,
        gender: formData.gender,
        contactNumber: formData.contactNumber,
        address: formData.address,
        emergencyContact: {
          name: formData.emergencyName,
          phoneNumber: formData.emergencyPhone
        }
      };

      await updatePatientProfile(payload);
      
      // Success! Close the modal
      setShowProfileModal(false);
    } catch (error) {
      console.error("Failed to setup profile:", error);
      // Optional: Add a toast notification here for the error
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-full min-h-[60vh] items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
      </div>
    );
  }

  return (
    <section className={`min-h-screen p-6 md:p-10 transition-colors duration-300 ${isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#FAFAFA] text-slate-900'}`}>
      
      {/* Dashboard Header */}
      <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
        Patient Dashboard
      </h1>
      <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
        Track your care plan, appointments, and messages.
      </p>

      {/* Metrics Grid */}
      <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {metrics.map((card, index) => {
          const Icon = card.icon || HeartPulse;
          return (
            <article 
              key={index} 
              className={`rounded-3xl border p-6 shadow-lg transition-transform hover:-translate-y-1 ${
                isDark 
                  ? 'border-slate-800 bg-[#131C31] shadow-black/20' 
                  : 'border-slate-200 bg-white shadow-blue-900/5'
              }`}
            >
              <div className={`inline-flex rounded-xl p-3 ${isDark ? 'bg-blue-900/30' : 'bg-blue-50'}`}>
                <Icon size={24} className={isDark ? 'text-blue-400' : 'text-blue-600'} />
              </div>
              <p className={`mt-4 text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {card.value}
              </p>
              <p className={`mt-1 text-sm font-bold uppercase tracking-wide ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                {card.label}
              </p>
            </article>
          );
        })}
      </div>

      {/* --- Mandatory Setup Modal --- */}
      {showProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className={`relative w-full max-w-2xl overflow-hidden rounded-3xl shadow-2xl ${isDark ? 'bg-[#131C31] border border-slate-700' : 'bg-white'}`}>
            
            {/* Modal Header */}
            <div className={`border-b px-8 py-6 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400">
                  <AlertCircle size={20} />
                </div>
                <div>
                  <h2 className={`text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                    Welcome to HealthBridge!
                  </h2>
                  <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                    Please complete your basic medical profile to continue.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCompleteProfile} className="p-8">
              <div className="grid gap-6 md:grid-cols-2">
                
                <div className="space-y-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Date of Birth *</label>
                  <input required type="date" name="dateOfBirth" value={formData.dateOfBirth} onChange={handleInputChange} className={`w-full rounded-xl border px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'border-slate-700 bg-slate-900/50 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`} />
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Gender *</label>
                  <select required name="gender" value={formData.gender} onChange={handleInputChange} className={`w-full rounded-xl border px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'border-slate-700 bg-slate-900/50 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`}>
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Phone Number *</label>
                  <input required type="tel" name="contactNumber" placeholder="+1 (555) 000-0000" value={formData.contactNumber} onChange={handleInputChange} className={`w-full rounded-xl border px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'border-slate-700 bg-slate-900/50 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`} />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Home Address *</label>
                  <input required type="text" name="address" placeholder="123 Health Ave..." value={formData.address} onChange={handleInputChange} className={`w-full rounded-xl border px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'border-slate-700 bg-slate-900/50 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`} />
                </div>

                <div className="md:col-span-2 border-t pt-4 mt-2 dark:border-slate-800">
                  <h3 className={`text-sm font-bold mb-4 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>Emergency Contact (Optional)</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <input type="text" name="emergencyName" placeholder="Contact Name" value={formData.emergencyName} onChange={handleInputChange} className={`w-full rounded-xl border px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'border-slate-700 bg-slate-900/50 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`} />
                    <input type="tel" name="emergencyPhone" placeholder="Contact Phone" value={formData.emergencyPhone} onChange={handleInputChange} className={`w-full rounded-xl border px-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 ${isDark ? 'border-slate-700 bg-slate-900/50 text-white' : 'border-slate-200 bg-slate-50 text-slate-900'}`} />
                  </div>
                </div>

              </div>

              {/* Submit Button */}
              <div className="mt-8 flex justify-end">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-8 py-3.5 text-sm font-bold text-white shadow-lg shadow-blue-600/20 transition-all hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 disabled:opacity-70 disabled:hover:translate-y-0 md:w-auto"
                >
                  {isSubmitting ? (
                    <span className="flex items-center gap-2">
                      <svg className="h-4 w-4 animate-spin text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      Saving Setup...
                    </span>
                  ) : (
                    <>
                      <Save size={18} />
                      Complete Profile
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </section>
  );
};

export default PatientDashboard;