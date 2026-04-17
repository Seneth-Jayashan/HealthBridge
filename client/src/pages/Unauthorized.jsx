import React from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, KeyRound, Home, Lock } from 'lucide-react';

const Unauthorized = () => {
  const { isDark = false } = useOutletContext() || {};
  const navigate = useNavigate();

  return (
    <section className={`min-h-[85vh] flex items-center justify-center px-4 py-16 relative overflow-hidden transition-colors duration-500 ${isDark ? 'bg-[#0B1120]' : 'bg-[#FAFAFA]'}`}>
      
      {/* Decorative Background Gradients (Security Alert Theme) */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[500px] bg-gradient-to-b from-rose-500/10 via-red-500/5 to-transparent blur-3xl -z-10 pointer-events-none rounded-full" />
      
      <div className={`relative w-full max-w-2xl text-center rounded-[3rem] p-10 md:p-16 border shadow-2xl z-10 animate-in fade-in zoom-in-95 duration-500 ${
        isDark 
          ? 'bg-[#131C31]/80 border-rose-900/30 shadow-black/50 backdrop-blur-xl' 
          : 'bg-white/80 border-white/40 shadow-rose-900/5 backdrop-blur-xl'
      }`}>
        
        {/* Advanced Animated Graphic Vector */}
        <div className="relative mx-auto w-48 h-48 mb-10 flex items-center justify-center">
          {/* Outer spinning dashed ring */}
          <div className="absolute inset-0 rounded-full border-[3px] border-dashed border-rose-500/20 animate-spin" style={{ animationDuration: '8s' }}></div>
          {/* Middle counter-spinning ring */}
          <div className="absolute inset-4 rounded-full border-t-4 border-l-2 border-rose-400/40 animate-spin" style={{ animationDuration: '4s', animationDirection: 'reverse' }}></div>
          {/* Inner glowing core */}
          <div className="absolute inset-8 rounded-full bg-rose-500/20 blur-xl animate-pulse" style={{ animationDuration: '2s' }}></div>
          
          {/* Center 3D Lock Icon */}
          <div className="relative z-10 bg-gradient-to-br from-rose-500 to-red-600 w-24 h-24 rounded-3xl flex items-center justify-center shadow-xl shadow-rose-600/30 transform -rotate-6 hover:rotate-0 hover:scale-110 transition-all duration-500">
            <Lock size={40} className="text-white drop-shadow-md" />
            <div className="absolute -bottom-2 -right-2 bg-white text-rose-600 p-1.5 rounded-xl shadow-lg animate-bounce" style={{ animationDuration: '2s' }}>
              <ShieldAlert size={20} />
            </div>
          </div>
        </div>

        {/* Typography */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 font-bold text-xs uppercase tracking-[0.2em] mb-6">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
          Error 401
        </div>
        
        <h1 className={`text-4xl md:text-5xl font-black tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Access Restricted
        </h1>
        
        <p className={`text-lg max-w-md mx-auto font-medium leading-relaxed mb-10 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
          Your current credentials do not grant you clearance to view this sector. Please verify your account privileges.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate(-1)}
            className={`w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-bold transition-all border-2 ${
              isDark 
                ? 'border-slate-700 bg-slate-800 text-white hover:bg-slate-700 hover:border-slate-600' 
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300'
            }`}
          >
            <ArrowLeft size={18} />
            Go Back
          </button>
          
          <Link 
            to="/login" 
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-rose-600 to-red-500 text-white font-bold shadow-lg shadow-rose-600/20 hover:shadow-rose-600/40 hover:-translate-y-0.5 transition-all"
          >
            <KeyRound size={18} />
            Authenticate
          </Link>
        </div>

        {/* Helpful Link */}
        <div className="mt-10 pt-8 border-t border-slate-200 dark:border-slate-800">
          <Link to="/" className={`inline-flex items-center gap-2 text-sm font-semibold transition-colors ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-800'}`}>
            <Home size={16} /> Return to Homepage
          </Link>
        </div>

      </div>
    </section>
  );
};

export default Unauthorized;