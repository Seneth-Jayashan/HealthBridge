import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useOutletContext, useSearchParams } from 'react-router-dom';
import { Activity, ShieldCheck, ArrowRight, Mail, Lock, Eye, EyeOff, Loader2, User, Phone, UserPlus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Register = () => {
  const { isDark = false } = useOutletContext() || {};
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { register } = useAuth();

  // Smart pre-selection based on URL (e.g. ?role=doctor)
  const initialRole = searchParams.get('role')?.toLowerCase() === 'doctor' ? 'Doctor' : 'Patient';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    role: initialRole,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const onChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
  };

  const normalizeRole = (role) => String(role || '').trim().toLowerCase();

  const getRedirectPath = (role, doctorStatus) => {
    const normalizedRole = normalizeRole(role);
    if (normalizedRole === 'admin') return '/admin/dashboard';
    if (normalizedRole === 'doctor') return doctorStatus === 'Approved' ? '/doctor/dashboard' : '/doctor/request';
    return '/patient/dashboard';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await register(form);
      navigate(getRedirectPath(user.role, user.doctorStatus), { replace: true });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0B1120]' : 'bg-[#FAFAFA]'}`}>
      
      {/* Decorative Background Gradients */}
      <div className="absolute top-0 right-1/4 w-full max-w-3xl h-[500px] bg-gradient-to-b from-blue-400/20 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />
      <div className="absolute bottom-0 left-1/4 w-full max-w-3xl h-[500px] bg-gradient-to-t from-indigo-400/10 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

      <div className={`w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row-reverse border z-10 animate-in fade-in zoom-in-95 duration-500 ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/50' : 'bg-white border-slate-100 shadow-blue-900/10'}`}>
        
        {/* Right Side: Medical Branding Panel (Reversed for Register) */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-bl from-blue-700 via-blue-800 to-indigo-900 p-12 flex-col justify-between text-white relative overflow-hidden">
          
          {/* Abstract shapes inside the blue panel */}
          <div className="absolute top-0 left-0 -ml-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/20 blur-2xl"></div>
          <div className="absolute bottom-0 right-0 -mr-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500/30 blur-2xl"></div>
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity group">
              <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20 group-hover:scale-105 transition-transform">
                <Activity size={24} className="text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight">HealthBridge</span>
            </Link>

            <h2 className="text-4xl font-black mb-6 leading-[1.1] tracking-tight">
              Join the <br/>
              <span className="text-blue-300">Care Network.</span>
            </h2>
            <p className="text-blue-100/80 text-base leading-relaxed mb-8 max-w-sm font-medium">
              Create your secure profile to instantly connect with specialists, manage prescriptions, and take control of your digital health.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            {/* Floating Glass Card Decor */}
            <div className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl ml-8 transform rotate-2">
               <div className="flex items-center gap-3 mb-2 text-emerald-300">
                 <UserPlus size={20} /> <span className="text-xs font-bold uppercase tracking-wider">Fast Onboarding</span>
               </div>
               <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                 <div className="h-full w-2/3 bg-emerald-400 rounded-full"></div>
               </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <ShieldCheck className="text-blue-300/70" size={24} />
              <div className="text-xs font-semibold text-blue-200/70">
                AES-256 Encrypted Connection.<br />HIPAA Compliant Platform.
              </div>
            </div>
          </div>
        </div>

        {/* Left Side: The Form */}
        <div className={`w-full md:w-7/12 p-8 sm:p-10 md:p-14 flex flex-col justify-center relative transition-colors duration-300 ${isDark ? 'bg-[#131C31]' : 'bg-white'}`}>
          
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-3 mb-8">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-md shadow-blue-600/20">
              <Activity size={24} className="text-white" />
            </div>
            <span className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>HealthBridge</span>
          </div>

          <div className="mb-8">
            <h3 className={`text-3xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Create Account</h3>
            <p className={`mt-2 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Register to access your secure digital dashboard.</p>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className={`mb-6 p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
              <div className="mt-1 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              </div>
              <p className={`text-sm font-semibold ${isDark ? 'text-rose-400' : 'text-rose-800'}`}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              
              {/* Full Name Field */}
              <div className="space-y-1.5 md:col-span-2">
                <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Full Name</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    name="name"
                    required
                    placeholder="Jane Doe"
                    value={form.name}
                    onChange={onChange}
                    className={`w-full pl-11 pr-5 py-3.5 rounded-2xl border font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm ${
                      isDark 
                        ? 'bg-[#0B1120]/50 border-slate-700 text-white placeholder-slate-500 focus:bg-[#0B1120]' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Email Field */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    name="email"
                    required
                    placeholder="jane@example.com"
                    value={form.email}
                    onChange={onChange}
                    className={`w-full pl-11 pr-5 py-3.5 rounded-2xl border font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm ${
                      isDark 
                        ? 'bg-[#0B1120]/50 border-slate-700 text-white placeholder-slate-500 focus:bg-[#0B1120]' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Phone Field */}
              <div className="space-y-1.5">
                <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Phone Number</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Phone size={18} />
                  </div>
                  <input 
                    type="tel" 
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={onChange}
                    placeholder="+94 77 123 4567"
                    className={`w-full pl-11 pr-5 py-3.5 rounded-2xl border font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm ${
                      isDark 
                        ? 'bg-[#0B1120]/50 border-slate-700 text-white placeholder-slate-500 focus:bg-[#0B1120]' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="space-y-1.5 md:col-span-2">
                <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Password</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <Lock size={18} />
                  </div>
                  <input 
                    type={showPassword ? "text" : "password"}
                    name="password"
                    required
                    minLength={6}
                    placeholder="At least 6 characters"
                    value={form.password}
                    onChange={onChange}
                    className={`w-full pl-11 pr-12 py-3.5 rounded-2xl border font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm ${
                      isDark 
                        ? 'bg-[#0B1120]/50 border-slate-700 text-white placeholder-slate-500 focus:bg-[#0B1120]' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                    }`}
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-500 dark:hover:text-slate-300 focus:outline-none transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Role Field */}
              <div className="space-y-1.5 md:col-span-2">
                <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Account Type</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                    <ShieldCheck size={18} />
                  </div>
                  <select
                    name="role"
                    value={form.role}
                    onChange={onChange}
                    className={`w-full pl-11 pr-5 py-3.5 rounded-2xl border font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm appearance-none ${
                      isDark 
                        ? 'bg-[#0B1120]/50 border-slate-700 text-white focus:bg-[#0B1120]' 
                        : 'bg-slate-50 border-slate-200 text-slate-900 focus:bg-white'
                    }`}
                  >
                    <option value="Patient" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Patient (Seeking Care)</option>
                    <option value="Doctor" className={isDark ? 'bg-slate-900 text-white' : 'bg-white text-slate-900'}>Doctor (Providing Care)</option>
                  </select>
                  {/* Custom Dropdown Arrow */}
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-400">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-6 rounded-2xl shadow-xl shadow-blue-600/20 transition-all hover:-translate-y-0.5 active:scale-[0.98] disabled:opacity-70 disabled:hover:translate-y-0 mt-8"
            >
              {isLoading ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  Creating Account...
                </>
              ) : (
                <>
                  <UserPlus size={20} />
                  Create Account
                </>
              )}
            </button>
          </form>

          <div className={`mt-8 text-center border-t pt-6 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Already registered?{' '}
              <Link to="/login" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">
                Sign in securely
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Register;