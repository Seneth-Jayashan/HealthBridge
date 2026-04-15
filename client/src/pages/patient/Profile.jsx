import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import { useAuth } from '../../context/AuthContext';
import { getPatientProfile, updatePatientProfile } from '../../services/patient.service';
import { getUserProfile, updateUserProfile, changeUserPassword } from '../../services/user.service'; 
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  ShieldCheck, 
  Heart, 
  Save,
  AlertCircle,
  Calendar,
  Droplet,
  Activity,
  Key,
  Lock,
  Settings
} from 'lucide-react';

const Profile = () => {
  const { isDark = false } = useOutletContext() || {};
  const { user, setUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [patientId, setPatientId] = useState('');

  // --- 1. Account State (Auth) ---
  const [isSavingAccount, setIsSavingAccount] = useState(false);
  
  // FIX: Pre-fill immediately from Context so it never flashes empty
  const [accountData, setAccountData] = useState({
    name: user?.name || '',
    phoneNumber: user?.phoneNumber || '',
    email: user?.email || '' 
  });

  // --- 2. Password State ---
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // --- 3. Patient Medical State ---
  const [isSavingPatient, setIsSavingPatient] = useState(false);
  const [patientData, setPatientData] = useState({
    dateOfBirth: '',
    gender: 'Prefer not to say',
    bloodGroup: '',
    address: '',
    allergies: '',
    chronicConditions: '',
    emergencyContact: { name: '', relationship: '', phoneNumber: '' }
  });

  // Fetch all profile data on mount
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [authRes, patientRes] = await Promise.all([
          getUserProfile().catch(() => null),
          getPatientProfile().catch(() => null)
        ]);

        // FIX: Always merge the backend response with the Context fallback
        setAccountData({
          name: authRes?.name || user?.name || '',
          phoneNumber: authRes?.phoneNumber || user?.phoneNumber || '',
          email: authRes?.email || user?.email || ''
        });

        if (patientRes) {
          setPatientId(patientRes.patientId || 'Pending Allocation');
          
          // FIX: Safely parse arrays to prevent .join() from crashing if backend sends null
          const safeAllergies = Array.isArray(patientRes.allergies) ? patientRes.allergies.join(', ') : '';
          const safeChronic = Array.isArray(patientRes.chronicConditions) ? patientRes.chronicConditions.join(', ') : '';
          
          setPatientData({
            dateOfBirth: patientRes.dateOfBirth ? patientRes.dateOfBirth.split('T')[0] : '',
            gender: patientRes.gender || 'Prefer not to say',
            bloodGroup: patientRes.bloodGroup || '',
            address: patientRes.address || '',
            allergies: safeAllergies,
            chronicConditions: safeChronic,
            // FIX: Safely access emergencyContact to prevent 'cannot read property of undefined' errors
            emergencyContact: {
              name: patientRes.emergencyContact?.name || '',
              relationship: patientRes.emergencyContact?.relationship || '',
              phoneNumber: patientRes.emergencyContact?.phoneNumber || ''
            }
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user?.id) {
      fetchAllData();
    }
  // FIX: Only depend on user.id, so it doesn't cause an infinite refetch loop when you update the user state
  }, [user?.id]); 

  // Run initial animations
  useEffect(() => {
    if (!isLoading && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      animate('.hb-profile-item', {
        y: [20, 0],
        opacity: [0, 1],
        ease: 'outCubic',
        duration: 800,
        delay: stagger(100)
      });
    }
  }, [isLoading]);

  // --- Handlers ---
  const handleAccountChange = (e) => {
    setAccountData({ ...accountData, [e.target.name]: e.target.value });
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    setPasswordError('');
  };

  const handlePatientChange = (e) => {
    setPatientData({ ...patientData, [e.target.name]: e.target.value });
  };

  const handleEmergencyChange = (e) => {
    setPatientData({
      ...patientData,
      emergencyContact: {
        ...patientData.emergencyContact,
        [e.target.name]: e.target.value
      }
    });
  };

  // --- Save Actions ---
  const handleSaveAccount = async (e) => {
    e.preventDefault();
    setIsSavingAccount(true);
    try {
      const updatedUser = await updateUserProfile({
        name: accountData.name,
        phoneNumber: accountData.phoneNumber
      });
      // This will now successfully update the context and cookie!
      if (setUser) setUser(updatedUser); 
    } catch (error) {
      console.error("Failed to update account:", error);
    } finally {
      setIsSavingAccount(false);
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }
    
    setIsSavingPassword(true);
    try {
      await changeUserPassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error("Failed to change password:", error);
      setPasswordError(error.response?.data?.message || "Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSavePatient = async (e) => {
    e.preventDefault();
    setIsSavingPatient(true);
    try {
      // FIX: Add safety checks before splitting strings back into arrays
      const payload = {
        ...patientData,
        allergies: patientData.allergies ? patientData.allergies.split(',').map(item => item.trim()).filter(Boolean) : [],
        chronicConditions: patientData.chronicConditions ? patientData.chronicConditions.split(',').map(item => item.trim()).filter(Boolean) : []
      };
      await updatePatientProfile(payload);
    } catch (error) {
      console.error("Failed to update patient profile:", error);
    } finally {
      setIsSavingPatient(false);
    }
  };

  const initials = accountData.name ? accountData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'US';

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0B1120]' : 'bg-[#FAFAFA]'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 md:p-10 font-sans transition-colors duration-300 ${isDark ? 'bg-[#0B1120] text-slate-100' : 'bg-[#FAFAFA] text-slate-900'}`}>
      
      {/* Page Header */}
      <div className="hb-profile-item mb-10 opacity-0">
        <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Profile Management
        </h1>
        <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Manage your account settings, security, and clinical records.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl">
        
        {/* --- Left Column: Identity Snapshot --- */}
        <div className="xl:col-span-1 space-y-8">
          <div className={`hb-profile-item rounded-3xl border p-8 opacity-0 shadow-lg ${isDark ? 'border-slate-800 bg-[#131C31] shadow-black/20' : 'border-slate-200 bg-white shadow-blue-900/5'}`}>
            <div className="flex flex-col items-center text-center">
              <div className="relative mb-6">
                <div className="h-28 w-28 rounded-full bg-blue-600 flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-blue-600/30 border-4 border-white dark:border-slate-800">
                  {initials}
                </div>
                <div className="absolute bottom-1 right-1 h-6 w-6 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full" title="Online & Verified"></div>
              </div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>{accountData.name}</h2>
              <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{patientId}</p>
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

          <div className={`hb-profile-item rounded-3xl border p-8 opacity-0 shadow-lg ${isDark ? 'border-slate-800 bg-[#131C31] shadow-black/20' : 'border-slate-200 bg-white shadow-blue-900/5'}`}>
            <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Heart className="text-red-500" size={20} /> Clinical Snapshot
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Blood Type</p>
                <p className={`text-xl font-black ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>{patientData.bloodGroup || 'N/A'}</p>
              </div>
              <div className={`col-span-2 p-4 rounded-2xl border ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Allergies</p>
                <p className={`text-base font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>{patientData.allergies || 'None recorded'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- Right Column: Settings Forms --- */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* SECTION 1: ACCOUNT SETTINGS */}
          <div className={`hb-profile-item rounded-3xl border opacity-0 shadow-lg overflow-hidden ${isDark ? 'border-slate-800 bg-[#131C31]' : 'border-slate-200 bg-white'}`}>
            <div className={`px-8 py-6 border-b flex items-center gap-2 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <Settings className="text-blue-500" size={24} />
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Account Details</h3>
            </div>
            <form onSubmit={handleSaveAccount} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Full Name</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><User size={18} className="text-slate-400" /></div>
                    <input type="text" name="name" value={accountData.name} onChange={handleAccountChange} className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} required />
                  </div>
                </div>
                <div className="space-y-2 opacity-70">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Email Address (Read Only)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail size={18} className="text-slate-400" /></div>
                    <input readOnly type="email" value={accountData.email} className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium ${isDark ? 'bg-slate-900 border-slate-800 text-slate-400 cursor-not-allowed' : 'bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed'}`} />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Phone Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Phone size={18} className="text-slate-400" /></div>
                    <input type="text" name="phoneNumber" value={accountData.phoneNumber} onChange={handleAccountChange} className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} required />
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button type="submit" disabled={isSavingAccount} className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-slate-700 transition-all disabled:opacity-70 dark:bg-slate-700 dark:hover:bg-slate-600">
                  {isSavingAccount ? 'Saving...' : <><Save size={16} /> Save Account</>}
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 2: SECURITY */}
          <div className={`hb-profile-item rounded-3xl border opacity-0 shadow-lg overflow-hidden ${isDark ? 'border-slate-800 bg-[#131C31]' : 'border-slate-200 bg-white'}`}>
            <div className={`px-8 py-6 border-b flex items-center gap-2 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <Lock className="text-amber-500" size={24} />
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Security</h3>
            </div>
            <form onSubmit={handleSavePassword} className="p-8">
              {passwordError && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/50 rounded-xl text-red-500 text-sm font-bold">{passwordError}</div>}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Current Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Key size={18} className="text-slate-400" /></div>
                    <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>New Password</label>
                  <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} required />
                </div>
                <div className="space-y-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Confirm New Password</label>
                  <input type="password" name="confirmPassword" value={passwordData.confirmPassword} onChange={handlePasswordChange} className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} required />
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button type="submit" disabled={isSavingPassword} className="flex items-center gap-2 bg-amber-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-700 transition-all disabled:opacity-70 shadow-lg shadow-amber-600/20">
                  {isSavingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>

          {/* SECTION 3: PATIENT MEDICAL PROFILE */}
          <div className={`hb-profile-item rounded-3xl border opacity-0 shadow-lg overflow-hidden ${isDark ? 'border-slate-800 bg-[#131C31]' : 'border-slate-200 bg-white'}`}>
            <div className={`px-8 py-6 border-b flex items-center gap-2 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <Activity className="text-emerald-500" size={24} />
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Medical Profile</h3>
            </div>
            
            <form onSubmit={handleSavePatient} className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Date of Birth</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Calendar size={18} className="text-slate-400" /></div>
                    <input type="date" name="dateOfBirth" value={patientData.dateOfBirth} onChange={handlePatientChange} className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Gender</label>
                  <select name="gender" value={patientData.gender} onChange={handlePatientChange} className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                    <option value="Prefer not to say">Prefer not to say</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-slate-400' : 'text-slate-700'}`}><Droplet size={14} className="text-red-500"/> Blood Group</label>
                  <select name="bloodGroup" value={patientData.bloodGroup} onChange={handlePatientChange} className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`}>
                    <option value="">Select Blood Group</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Residential Address</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><MapPin size={18} className="text-slate-400" /></div>
                    <input type="text" name="address" value={patientData.address} onChange={handlePatientChange} className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                </div>

                {/* Medical Specifics */}
                <div className="md:col-span-2 space-y-2 pt-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Allergies (comma separated)</label>
                  <input type="text" name="allergies" placeholder="e.g. Peanuts, Penicillin" value={patientData.allergies} onChange={handlePatientChange} className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                </div>

                <div className="md:col-span-2 space-y-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Chronic Conditions (comma separated)</label>
                  <input type="text" name="chronicConditions" placeholder="e.g. Asthma, Diabetes" value={patientData.chronicConditions} onChange={handlePatientChange} className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                </div>

                {/* Emergency Contact */}
                <div className="md:col-span-2 space-y-3 pt-4">
                  <h4 className={`font-bold border-b pb-2 flex items-center gap-2 ${isDark ? 'border-slate-800 text-white' : 'border-slate-200 text-slate-800'}`}>
                    Emergency Contact
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <input type="text" name="name" placeholder="Contact Name" value={patientData.emergencyContact.name} onChange={handleEmergencyChange} className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/30 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                    <input type="text" name="relationship" placeholder="Relationship" value={patientData.emergencyContact.relationship} onChange={handleEmergencyChange} className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/30 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                    <input type="text" name="phoneNumber" placeholder="Phone Number" value={patientData.emergencyContact.phoneNumber} onChange={handleEmergencyChange} className={`w-full px-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-red-500/30 ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                </div>

              </div>

              <div className={`mt-8 pt-6 border-t flex justify-end gap-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button type="submit" disabled={isSavingPatient} className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-70 disabled:hover:translate-y-0">
                  {isSavingPatient ? 'Saving...' : <><Save size={18} /> Save Medical Data</>}
                </button>
              </div>
            </form>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Profile;