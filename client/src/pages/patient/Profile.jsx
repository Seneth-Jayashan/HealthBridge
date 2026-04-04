import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import { useAuth } from '../../context/AuthContext';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Heart, 
  Activity, 
  Save,
  AlertCircle,
  Calendar
} from 'lucide-react';

const Profile = () => {
  // Inherit dark mode state from the DashboardLayout (if you set one up), otherwise default to false
  const { isDark = false } = useOutletContext() || {};
  const { user } = useAuth();

  // Local state for the editable form (pre-filled with context data)
  const [formData, setFormData] = useState({
    name: user?.name || 'Jane Doe',
    email: user?.email || 'jane.doe@example.com',
    phone: '+1 (555) 123-4567', // Mocked for UI
    address: '123 Healthway Drive, Medical District, NY 10001',
    dob: '1985-06-15',
    emergencyContact: 'John Doe - +1 (555) 987-6543'
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    // Elegant staggered entrance for dashboard elements
    animate('.hb-profile-item', {
      y: [20, 0],
      opacity: [0, 1],
      ease: 'outCubic',
      duration: 800,
      delay: stagger(100)
    });
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = (e) => {
    e.preventDefault();
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      // In a real app, you would show a success toast notification here
    }, 1000);
  };

  // Generate initials for the avatar
  const initials = formData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <div className={`min-h-screen p-6 md:p-10 font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#FAFAFA] text-slate-900'}`}>
      
      {/* --- Page Header --- */}
      <div className="hb-profile-item mb-10 opacity-0">
        <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Patient Profile
        </h1>
        <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Manage your personal information, security preferences, and clinical details.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl">
        
        {/* --- Left Column: Identity & Clinical Snapshot --- */}
        <div className="xl:col-span-1 space-y-8">
          
          {/* ID Card */}
          <div className={`hb-profile-item rounded-3xl border p-8 opacity-0 shadow-lg ${isDark ? 'border-slate-800 bg-[#131C31] shadow-black/20' : 'border-slate-200 bg-white shadow-blue-900/5'}`}>
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="h-28 w-28 rounded-full bg-blue-600 flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-blue-600/30 border-4 border-white dark:border-slate-800">
                  {initials}
                </div>
                <div className="absolute bottom-1 right-1 h-6 w-6 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full" title="Online & Verified"></div>
              </div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{formData.name}</h2>
              <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>Patient ID: #PT-84729</p>
            </div>

            <div className={`mt-8 pt-8 border-t ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck className="text-emerald-500" size={20} />
                <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>Identity Verified</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="text-blue-500" size={20} />
                <span className={`text-sm font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>HIPAA Compliant Record</span>
              </div>
            </div>
          </div>

          {/* Vitals / Medical Quick-Glance */}
          <div className={`hb-profile-item rounded-3xl border p-8 opacity-0 shadow-lg ${isDark ? 'border-slate-800 bg-[#131C31] shadow-black/20' : 'border-slate-200 bg-white shadow-blue-900/5'}`}>
            <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Heart className="text-red-500" size={20} /> Clinical Snapshot
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Blood Type</p>
                <p className={`text-xl font-black ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>O+</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Height</p>
                <p className={`text-xl font-black ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>5'8"</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Weight</p>
                <p className={`text-xl font-black ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>145 lb</p>
              </div>
              <div className={`p-4 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Allergies</p>
                <p className={`text-xl font-black ${isDark ? 'text-red-400' : 'text-red-600'}`}>Penicillin</p>
              </div>
            </div>
          </div>
          
        </div>

        {/* --- Right Column: Editable Information Form --- */}
        <div className={`hb-profile-item xl:col-span-2 rounded-3xl border opacity-0 shadow-lg overflow-hidden ${isDark ? 'border-slate-800 bg-[#131C31] shadow-black/20' : 'border-slate-200 bg-white shadow-blue-900/5'}`}>
          <div className={`px-8 py-6 border-b flex justify-between items-center ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
            <h3 className={`text-xl font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <User className="text-blue-500" size={24} /> Personal Information
            </h3>
          </div>

          <form onSubmit={handleSave} className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              
              {/* Name Field */}
              <div className="space-y-2">
                <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Full Legal Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:bg-slate-900' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'}`}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-2">
                <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:bg-slate-900' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'}`}
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-2">
                <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Phone Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:bg-slate-900' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'}`}
                  />
                </div>
              </div>

              {/* DOB Field */}
              <div className="space-y-2">
                <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Date of Birth</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Calendar size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="date" 
                    name="dob"
                    value={formData.dob}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:bg-slate-900' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'}`}
                  />
                </div>
              </div>

              {/* Address Field (Full Width) */}
              <div className="md:col-span-2 space-y-2">
                <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Residential Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <MapPin size={18} className="text-slate-400" />
                  </div>
                  <input 
                    type="text" 
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:bg-slate-900' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'}`}
                  />
                </div>
              </div>

              {/* Emergency Contact (Full Width) */}
              <div className="md:col-span-2 space-y-2">
                <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Emergency Contact</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Activity size={18} className="text-red-400" />
                  </div>
                  <input 
                    type="text" 
                    name="emergencyContact"
                    value={formData.emergencyContact}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/30 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white focus:bg-slate-900' : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'}`}
                  />
                </div>
                <p className={`text-xs font-medium mt-2 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                  This person will be contacted in case of a medical emergency during a telehealth visit.
                </p>
              </div>

            </div>

            <div className={`mt-10 pt-8 border-t flex justify-end gap-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              <button 
                type="button"
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-colors ${isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                Cancel
              </button>
              <button 
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
              >
                {isSaving ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                    Saving...
                  </span>
                ) : (
                  <>
                    <Save size={18} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Profile;