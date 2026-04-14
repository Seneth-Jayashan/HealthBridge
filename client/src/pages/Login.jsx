import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, ShieldCheck, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
      setError(err.response?.data?.message || 'Unable to connect to the secure server.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      
      {/* Decorative Background Blur */}
      <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 -left-20 h-96 w-96 rounded-full bg-blue-600/5 blur-[100px]"></div>
        <div className="absolute bottom-1/4 -right-20 h-96 w-96 rounded-full bg-red-600/5 blur-[100px]"></div>
      </div>

      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-blue-900/5 overflow-hidden flex flex-col md:flex-row border border-slate-100">
        
        {/* Left Side: Medical Branding Panel */}
        <div className="hidden md:flex md:w-5/12 bg-blue-700 p-12 flex-col justify-between text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          
          <div className="relative z-10">
            <Link to="/" className="inline-flex items-center gap-2 mb-12 hover:opacity-80 transition-opacity">
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Activity size={24} className="text-white" />
              </div>
              <span className="text-2xl font-black tracking-tight">HealthBridge</span>
            </Link>

            <h2 className="text-3xl font-bold mb-4 leading-tight">Secure Clinical<br />Access Portal</h2>
            <p className="text-blue-100 text-sm leading-relaxed mb-8">
              Sign in to manage appointments, review electronic health records, and connect with your healthcare providers.
            </p>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 bg-blue-800/50 p-4 rounded-xl border border-blue-600/50 backdrop-blur-sm">
              <ShieldCheck className="text-blue-200" size={24} />
              <div className="text-xs font-medium text-blue-100">
                Connection encrypted with AES-256.<br />HIPAA Compliant Session.
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: The Form */}
        <div className="w-full md:w-7/12 p-10 md:p-16 flex flex-col justify-center bg-white relative">
          
          {/* Mobile Logo */}
          <div className="md:hidden flex items-center gap-2 mb-8">
            <div className="bg-blue-700 p-2 rounded-lg">
              <Activity size={20} className="text-white" />
            </div>
            <span className="text-xl font-black text-slate-900">HealthBridge</span>
          </div>

          <div className="mb-10 text-center md:text-left">
            <h3 className="text-2xl md:text-3xl font-black text-slate-900">Welcome Back</h3>
            <p className="text-slate-500 mt-2 font-medium text-sm">Please enter your credentials to access your account.</p>
          </div>

          {/* Error Alert Box */}
          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3">
              <div className="mt-0.5 w-2 h-2 rounded-full bg-red-500 flex-shrink-0"></div>
              <p className="text-sm font-medium text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <input 
                type="email" 
                required
                placeholder="patient@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center ml-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
                <a href="#" className="text-xs font-bold text-blue-700 hover:text-blue-800">Forgot Password?</a>
              </div>
              <input 
                type="password" 
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-5 py-4 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 focus:bg-white transition-all"
              />
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-red-600/20 transition-all active:scale-[0.98] disabled:opacity-70 mt-4"
            >
              {isLoading ? (
                'Authenticating...'
              ) : (
                <>
                  Secure Login <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <p className="mt-8 text-center md:text-left text-sm text-slate-500 font-medium">
            Don't have an account yet?{' '}
            <Link to="/register" className="text-blue-700 font-bold hover:underline">
              Create a Patient Profile
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
};

export default Login;