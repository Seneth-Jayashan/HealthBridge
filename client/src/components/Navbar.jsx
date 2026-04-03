import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, LayoutDashboard } from 'lucide-react';
// Make sure this path matches where you saved AuthContext.jsx
import { useAuth } from '../context/AuthContext'; 

const Navbar = ({ isDark }) => {
  const navigate = useNavigate();
  // Pulling state and functions directly from your awesome AuthContext
  const { isAuthenticated, user, logout } = useAuth();

  const handleLogout = () => {
    logout(); // Let the context handle the cookie clearing
    navigate('/login');
  };

  // Dynamically determine where the "Dashboard" button should go
  const getDashboardLink = () => {
    if (user?.role === 'Admin') return '/admin/dashboard';
    if (user?.role === 'Doctor') return '/doctor/dashboard';
    return '/patient/dashboard';
  };

  return (
    <nav className={`relative z-50 border-b backdrop-blur-xl px-6 py-4 md:px-12 flex justify-between items-center ${isDark ? 'border-white/5 bg-[#0B1120]/80' : 'border-slate-200/50 bg-white/80'}`}>
      
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-xl shadow-lg shadow-blue-900/20">
          <Activity className="text-white" size={24} />
        </div>
        <Link to="/" className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
          Health<span className="text-blue-600">Bridge</span>
        </Link>
      </div>

      {/* Dynamic Links Based on Auth State */}
      <div className="flex items-center gap-6">
        {isAuthenticated ? (
            // --- LOGGED IN STATE ---
            <>
            <Link 
              to={getDashboardLink()} 
              className={`font-bold text-sm tracking-wide uppercase transition-colors hidden sm:flex sm:items-center sm:gap-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-blue-700'}`}
            >
              <LayoutDashboard size={18} />
              My Dashboard
            </Link>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 text-white border border-red-600 px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-red-700 hover:border-red-700 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              <LogOut size={16} strokeWidth={2.5} />
              Logout
            </button>
            </>
          ) : (
          // --- LOGGED OUT STATE ---
          <>
            <Link 
              to="/login" 
              className={`font-bold text-sm tracking-wide uppercase transition-colors hidden sm:block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-blue-700'}`}
            >
              Provider Portal
            </Link>
            <Link 
              to="/login" 
              className={`font-bold text-sm tracking-wide uppercase transition-colors hidden sm:block ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-blue-700'}`}
            >
              Patient Login
            </Link>
            <Link 
              to="/register" 
              className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              Book Visit
            </Link>
          </>
        )}
      </div>
      
    </nav>
  );
};

export default Navbar;