import React, { useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { Activity, ShieldCheck, ArrowRight, Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { isDark = false } = useOutletContext() || {};
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { login } = useAuth();

  const normalizeRole = (role) => String(role || '').trim().toLowerCase();

  const getRedirectPath = (role, doctorStatus) => {
    const normalizedRole = normalizeRole(role);
    if (normalizedRole === 'admin') return '/admin/dashboard';
    if (normalizedRole === 'doctor') return doctorStatus === 'Approved' ? '/doctor/dashboard' : '/doctor/request';
    return '/patient/dashboard';
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const user = await login({
        email,
        password
      });

      navigate(getRedirectPath(user.role, user.doctorStatus), { replace: true });

    } catch (err) {
      setError(err.response?.data?.message || 'Unable to connect to the secure server. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 sm:p-8 font-sans relative overflow-hidden transition-colors duration-300 ${isDark ? 'bg-[#0B1120]' : 'bg-[#FAFAFA]'}`}>
      
      {/* Decorative Background Gradients */}
      <div className="absolute top-0 left-1/4 w-full max-w-3xl h-[500px] bg-gradient-to-b from-blue-400/20 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />
      <div className="absolute bottom-0 right-1/4 w-full max-w-3xl h-[500px] bg-gradient-to-t from-indigo-400/10 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />

      <div className={`w-full max-w-5xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col md:flex-row border z-10 animate-in fade-in zoom-in-95 duration-500 ${isDark ? 'bg-[#131C31] border-slate-800 shadow-black/50' : 'bg-white border-slate-100 shadow-blue-900/10'}`}>
        
        {/* Left Side: Medical Branding Panel */}
        <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 p-12 flex-col justify-between text-white relative overflow-hidden">
          
          {/* Abstract shapes inside the blue panel */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-blue-500/20 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 rounded-full bg-indigo-500/30 blur-2xl"></div>
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity group">
              <div className="bg-white/10 p-2.5 rounded-xl backdrop-blur-md border border-white/20 group-hover:scale-105 transition-transform">
                <Activity size={24} className="text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight">HealthBridge</span>
            </Link>

            <h2 className="text-4xl font-black mb-6 leading-[1.1] tracking-tight">
              Secure <br/>
              <span className="text-blue-300">Clinical Access.</span>
            </h2>
            <p className="text-blue-100/80 text-base leading-relaxed mb-8 max-w-sm font-medium">
              Sign in to manage your appointments, review electronic health records, and connect with your healthcare providers instantly.
            </p>
          </div>

          <div className="relative z-10 space-y-4">
            {/* Floating Glass Card Decor */}
            <div className="bg-white/10 p-5 rounded-2xl border border-white/10 backdrop-blur-md shadow-xl mr-8 transform -rotate-2">
               <div className="flex items-center gap-3 mb-2 text-emerald-300">
                 <ShieldCheck size={20} /> <span className="text-xs font-bold uppercase tracking-wider">Protected Gateway</span>
               </div>
               <div className="h-1.5 w-full bg-white/20 rounded-full overflow-hidden">
                 <div className="h-full w-full bg-emerald-400 rounded-full"></div>
               </div>
            </div>

            <div className="flex items-center gap-3 pt-4">
              <ShieldCheck className="text-blue-300/70" size={24} />
              <div className="text-xs font-semibold text-blue-200/70">
                AES-256 Encrypted Connection.<br />HIPAA Compliant Session.
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: The Form */}
        <div className={`w-full md:w-7/12 p-8 sm:p-12 md:p-16 flex flex-col justify-center relative transition-colors duration-300 ${isDark ? 'bg-[#131C31]' : 'bg-white'}`}>
          
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-3 mb-10">
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-md shadow-blue-600/20">
              <Activity size={24} className="text-white" />
            </div>
            <span className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>HealthBridge</span>
          </div>

          <div className="mb-10">
            <h3 className={`text-3xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Welcome Back</h3>
            <p className={`mt-3 font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Please enter your credentials to access your account.</p>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className={`mb-8 p-4 rounded-2xl border flex items-start gap-3 animate-in fade-in slide-in-from-top-2 ${isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-100'}`}>
              <div className="mt-1 flex-shrink-0">
                <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></div>
              </div>
              <p className={`text-sm font-semibold ${isDark ? 'text-rose-400' : 'text-rose-800'}`}>{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label className={`text-xs font-bold uppercase tracking-wider ml-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Email Address</label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Mail size={20} />
                </div>
                <input 
                  type="email" 
                  required
                  placeholder="patient@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full pl-12 pr-5 py-4 rounded-2xl border font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm ${
                    isDark 
                      ? 'bg-[#0B1120]/50 border-slate-700 text-white placeholder-slate-500 focus:bg-[#0B1120]' 
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white'
                  }`}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className={`text-xs font-bold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Password</label>
                <button type="button" className="text-xs font-bold text-blue-500 hover:text-blue-400 transition-colors">
                  Forgot?
                </button>
              </div>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <Lock size={20} />
                </div>
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`w-full pl-12 pr-12 py-4 rounded-2xl border font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all shadow-sm ${
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
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
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
                  Authenticating...
                </>
              ) : (
                <>
                  Secure Login <ArrowRight size={20} />
                </>
              )}
            </button>
          </form>

          <div className={`mt-10 text-center border-t pt-8 ${isDark ? 'border-slate-800' : 'border-slate-100'}`}>
            <p className={`text-sm font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              Don't have an account yet?{' '}
              <Link to="/register" className="text-blue-500 font-bold hover:text-blue-400 transition-colors">
                Create a Profile
              </Link>
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;