import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { animate, stagger } from 'animejs';
import { useAuth } from '../../context/AuthContext';
import { getDoctorProfile, updateDoctorProfile } from '../../services/doctor.service';
import { getUserProfile, updateUserProfile, changeUserPassword } from '../../services/user.service'; // Added Auth Services
import { SPECIALIZATION } from '@healthbridge/shared/src/constants/specialization.js';
import UpdateAvailabilityModal from '../../components/doctor/UpdateAvailabilityModal'; 
import { 
  Stethoscope, 
  Award, 
  FileText, 
  Banknote, 
  ShieldCheck, 
  ShieldAlert, 
  ShieldQuestion,
  Star,
  Save,
  Clock,
  FileBadge,
  ChevronDown,
  Calendar,
  User,       // Added missing Lucide Icons
  Mail,
  Phone,
  Settings,
  Lock,
  Key
} from 'lucide-react';

const DoctorProfile = () => {
  const { isDark = false } = useOutletContext() || {};
  const { user, setUser } = useAuth();

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- 1. Account State (Auth) ---
  const [isSavingAccount, setIsSavingAccount] = useState(false);
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

  // --- 3. Doctor Professional State ---
  const [isSavingDoctor, setIsSavingDoctor] = useState(false);
  const [doctorSaveMessage, setDoctorSaveMessage] = useState(null);
  const [doctorData, setDoctorData] = useState({
    specialization: '',
    registrationNumber: '',
    qualifications: '', 
    experienceYears: 0,
    bio: '',
    consultationFee: 0,
    verificationStatus: 'Pending',
    averageRating: 0,
    totalReviews: 0,
    doctorID: '',
    availability: [] 
  });

  // Fetch all profile data (Auth + Doctor)
  const fetchProfile = async () => {
    try {
      const [authRes, docRes] = await Promise.all([
        getUserProfile().catch(() => null),
        getDoctorProfile().catch(() => null)
      ]);

      // Populate Auth Details
      setAccountData({
        name: authRes?.name || user?.name || '',
        phoneNumber: authRes?.phoneNumber || user?.phoneNumber || '',
        email: authRes?.email || user?.email || ''
      });

      // Populate Doctor Details
      if (docRes) {
        setDoctorData({
          ...docRes,
          qualifications: Array.isArray(docRes.qualifications) ? docRes.qualifications.join(', ') : '',
        });
      }
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

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

  const handleDoctorChange = (e) => {
    const { name, value } = e.target;
    setDoctorData(prev => ({ ...prev, [name]: value }));
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
      setPasswordError("Password updated successfully!"); // Optional: show success inline
      setTimeout(() => setPasswordError(''), 3000);
    } catch (error) {
      console.error("Failed to change password:", error);
      setPasswordError(error.response?.data?.message || "Failed to update password");
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleSaveDoctor = async (e) => {
    e.preventDefault();
    setIsSavingDoctor(true);
    setDoctorSaveMessage(null);

    try {
      const payload = {
        ...doctorData,
        experienceYears: Number(doctorData.experienceYears),
        consultationFee: Number(doctorData.consultationFee),
        qualifications: doctorData.qualifications
          ? doctorData.qualifications.split(',').map(item => item.trim()).filter(Boolean)
          : []
      };

      await updateDoctorProfile(payload);
      setDoctorSaveMessage({ type: 'success', text: 'Professional profile updated successfully!' });
      
      setTimeout(() => setDoctorSaveMessage(null), 3000);
    } catch (error) {
      console.error("Failed to update doctor profile:", error);
      setDoctorSaveMessage({ type: 'error', text: error.response?.data?.message || 'Failed to update profile.' });
    } finally {
      setIsSavingDoctor(false);
    }
  };

  // --- Helpers ---
  const renderVerificationBadge = (status) => {
    switch(status) {
      case 'Approved':
        return <div className="flex flex-col items-center"><ShieldCheck size={32} className="text-emerald-500 mb-2" /><span className={`text-sm font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>Verified Professional</span></div>;
      case 'Rejected':
        return <div className="flex flex-col items-center"><ShieldAlert size={32} className="text-red-500 mb-2" /><span className={`text-sm font-bold ${isDark ? 'text-red-400' : 'text-red-600'}`}>Verification Failed</span></div>;
      case 'Review':
      case 'Pending':
      default:
        return <div className="flex flex-col items-center"><ShieldQuestion size={32} className="text-amber-500 mb-2" /><span className={`text-sm font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>Under Review</span></div>;
    }
  };

  const initials = accountData.name ? accountData.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'DR';

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
      <div className="hb-profile-item mb-10 opacity-0 max-w-7xl mx-auto">
        <h1 className={`text-3xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Professional Profile
        </h1>
        <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Manage your account settings, security, and clinical credentials.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 max-w-7xl mx-auto">
        
        {/* --- Left Column: Identity Snapshot --- */}
        <div className="xl:col-span-1 space-y-8">
          <div className={`hb-profile-item rounded-3xl border p-8 opacity-0 shadow-lg ${isDark ? 'border-slate-800 bg-[#131C31] shadow-black/20' : 'border-slate-200 bg-white shadow-blue-900/5'}`}>
            <div className="flex flex-col items-center text-center">
              <div className="h-28 w-28 rounded-full bg-blue-600 flex items-center justify-center text-4xl font-black text-white shadow-xl shadow-blue-600/30 border-4 border-white dark:border-slate-800 mb-6">
                {initials}
              </div>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Dr. {accountData.name || 'Doctor'}</h2>
              <p className={`text-sm font-semibold mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{doctorData.specialization || 'General Practitioner'}</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>ID: {doctorData.doctorID || 'Pending'}</p>
            </div>

            <div className={`mt-8 pt-8 border-t flex justify-center ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
              {renderVerificationBadge(doctorData.verificationStatus)}
            </div>
          </div>

          <div className={`hb-profile-item rounded-3xl border p-8 opacity-0 shadow-lg ${isDark ? 'border-slate-800 bg-[#131C31] shadow-black/20' : 'border-slate-200 bg-white shadow-blue-900/5'}`}>
            <h3 className={`text-lg font-bold mb-6 flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
              <Star className="text-amber-500" size={20} /> Patient Feedback
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-4 rounded-2xl border flex flex-col items-center text-center ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Rating</p>
                <p className={`text-3xl font-black ${isDark ? 'text-amber-400' : 'text-amber-500'}`}>{doctorData.averageRating.toFixed(1)}</p>
              </div>
              <div className={`p-4 rounded-2xl border flex flex-col items-center text-center ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50'}`}>
                <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>Reviews</p>
                <p className={`text-3xl font-black ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{doctorData.totalReviews}</p>
              </div>
            </div>
          </div>

          <div className="hb-profile-item opacity-0">
            <button 
              onClick={() => setIsModalOpen(true)}
              className={`w-full flex items-center justify-center gap-2 px-5 py-4 rounded-2xl font-bold transition-colors border shadow-sm ${isDark ? 'bg-blue-900/30 text-blue-400 border-blue-800 hover:bg-blue-800/50' : 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100'}`}
            >
              <Calendar size={18} />
              Update Schedule Availability
            </button>
          </div>
        </div>

        {/* --- Right Column: Settings & Credentials Forms --- */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* SECTION 1: ACCOUNT SETTINGS (Added from User Profile) */}
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

          {/* SECTION 2: SECURITY (Added from User Profile) */}
          <div className={`hb-profile-item rounded-3xl border opacity-0 shadow-lg overflow-hidden ${isDark ? 'border-slate-800 bg-[#131C31]' : 'border-slate-200 bg-white'}`}>
            <div className={`px-8 py-6 border-b flex items-center gap-2 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <Lock className="text-amber-500" size={24} />
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Security</h3>
            </div>
            <form onSubmit={handleSavePassword} className="p-8">
              {passwordError && (
                <div className={`mb-4 p-3 border rounded-xl text-sm font-bold ${passwordError.includes('success') ? 'bg-emerald-500/10 border-emerald-500/50 text-emerald-500' : 'bg-red-500/10 border-red-500/50 text-red-500'}`}>
                  {passwordError}
                </div>
              )}
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

          {/* SECTION 3: PROFESSIONAL CREDENTIALS */}
          <div className={`hb-profile-item rounded-3xl border opacity-0 shadow-lg overflow-hidden ${isDark ? 'border-slate-800 bg-[#131C31]' : 'border-slate-200 bg-white'}`}>
            <div className={`px-8 py-6 border-b flex items-center gap-2 ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-100 bg-slate-50/50'}`}>
              <Stethoscope className="text-blue-500" size={24} />
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>Professional Credentials</h3>
            </div>
            
            <form onSubmit={handleSaveDoctor} className="p-8">
              {doctorSaveMessage && (
                <div className={`mb-6 p-4 rounded-xl border font-bold text-sm flex items-center gap-2 ${doctorSaveMessage.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-600 dark:text-red-400'}`}>
                  {doctorSaveMessage.type === 'success' ? <ShieldCheck size={20} /> : <ShieldAlert size={20} />}
                  {doctorSaveMessage.text}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Specialization */}
                <div className="space-y-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Specialization</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Stethoscope size={18} className="text-slate-400" />
                    </div>
                    <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                      <ChevronDown size={18} className="text-slate-400" />
                    </div>
                    <select 
                      name="specialization" 
                      value={doctorData.specialization} 
                      onChange={handleDoctorChange} 
                      className={`w-full pl-11 pr-10 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors appearance-none ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} 
                      required
                    >
                      <option value="" disabled>Select a Specialization</option>
                      {Object.values(SPECIALIZATION).map((spec) => (
                        <option key={spec} value={spec}>
                          {spec}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Registration Number */}
                <div className="space-y-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Medical Registration Number</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><FileBadge size={18} className="text-slate-400" /></div>
                    <input type="text" name="registrationNumber" value={doctorData.registrationNumber} onChange={handleDoctorChange} className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} required />
                  </div>
                </div>

                {/* Experience Years */}
                <div className="space-y-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Years of Experience</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Clock size={18} className="text-slate-400" /></div>
                    <input type="number" min="0" name="experienceYears" value={doctorData.experienceYears} onChange={handleDoctorChange} className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} required />
                  </div>
                </div>

                {/* Consultation Fee */}
                <div className="space-y-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Consultation Fee (LKR)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Banknote size={18} className="text-slate-400" /></div>
                    <input type="number" min="0" step="100" name="consultationFee" value={doctorData.consultationFee} onChange={handleDoctorChange} className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} required />
                  </div>
                </div>

                {/* Qualifications */}
                <div className="space-y-2 md:col-span-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Qualifications (Comma Separated)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Award size={18} className="text-slate-400" /></div>
                    <input type="text" name="qualifications" value={doctorData.qualifications} onChange={handleDoctorChange} placeholder="e.g., MBBS, MD, FRCP" className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                </div>

                {/* Bio */}
                <div className="space-y-2 md:col-span-2">
                  <label className={`text-sm font-bold ${isDark ? 'text-slate-400' : 'text-slate-700'}`}>Professional Bio</label>
                  <div className="relative">
                    <div className="absolute top-3 left-4 pointer-events-none"><FileText size={18} className="text-slate-400" /></div>
                    <textarea name="bio" value={doctorData.bio} onChange={handleDoctorChange} rows={4} placeholder="Briefly describe your expertise and approach to patient care..." className={`w-full pl-11 pr-4 py-3 rounded-xl border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-colors resize-none ${isDark ? 'bg-slate-900/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-200 text-slate-900'}`} />
                  </div>
                </div>

              </div>

              <div className={`mt-8 pt-6 border-t flex justify-end gap-4 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
                <button 
                  type="submit" 
                  disabled={isSavingDoctor} 
                  className="flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20 hover:bg-blue-700 hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSavingDoctor ? 'Saving...' : <><Save size={18} /> Save Profile</>}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      <UpdateAvailabilityModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchProfile}
        initialAvailability={doctorData?.availability || []}
      />
    </div>
  );
};

export default DoctorProfile;