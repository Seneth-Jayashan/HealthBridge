import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, LogOut, LayoutDashboard, Menu, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext'; 

const Navbar = ({ isDark }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user, logout } = useAuth();
  
  // State for mobile menu toggle
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = () => {
    logout(); 
    setIsOpen(false); // Close menu on logout
    navigate('/login');
  };

  const getDashboardLink = () => {
    if (user?.role === 'Admin') return '/admin/dashboard';
    if (user?.role === 'Doctor') return '/doctor/dashboard';
    return '/patient/dashboard';
  };

  // Helper to close mobile menu after clicking a link
  const closeMenu = () => setIsOpen(false);

  return (
    <nav className={`relative z-50 border-b backdrop-blur-xl px-6 py-4 md:px-12 flex justify-between items-center ${isDark ? 'border-white/5 bg-[#0B1120]/80' : 'border-slate-200/50 bg-white/80'}`}>
      
      {/* Logo */}
      <div className="flex items-center gap-2.5">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 p-2 rounded-xl shadow-lg shadow-blue-900/20">
          <Activity className="text-white" size={24} />
        </div>
        <Link to="/" className={`text-2xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`} onClick={closeMenu}>
          Health<span className="text-blue-600">Bridge</span>
        </Link>
      </div>

      {/* Desktop Navigation */}
      <div className="hidden md:flex items-center gap-6">
        {isAuthenticated ? (
          <>
            <Link 
              to={getDashboardLink()} 
              className={`font-bold text-sm tracking-wide uppercase transition-colors flex items-center gap-2 ${isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-blue-700'}`}
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
          <>
            <Link 
              to="/login" 
              className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg shadow-blue-600/20 hover:bg-blue-700 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              Login
            </Link>
            <Link 
              to="/register" 
              className="bg-red-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide shadow-lg shadow-red-600/20 hover:bg-red-700 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              Sign Up
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu Toggle Button */}
      <button 
        className={`md:hidden p-2 rounded-lg transition-colors ${isDark ? 'text-white hover:bg-white/10' : 'text-slate-900 hover:bg-slate-100'}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle Menu"
      >
        {isOpen ? <X size={28} /> : <Menu size={28} />}
      </button>

      {/* Mobile Navigation Dropdown */}
      {isOpen && (
        <div className={`absolute top-full left-0 w-full border-b shadow-xl md:hidden flex flex-col p-6 gap-4 ${isDark ? 'bg-[#0B1120] border-white/5' : 'bg-white border-slate-200'}`}>
          {isAuthenticated ? (
            <>
              <Link 
                to={getDashboardLink()} 
                onClick={closeMenu}
                className={`font-bold text-base tracking-wide uppercase transition-colors flex items-center gap-3 p-3 rounded-xl ${isDark ? 'text-slate-200 hover:bg-white/5' : 'text-slate-700 hover:bg-slate-50'}`}
              >
                <LayoutDashboard size={20} />
                My Dashboard
              </Link>
              <button 
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 bg-red-600 text-white px-5 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide active:scale-95 transition-transform w-full"
              >
                <LogOut size={18} strokeWidth={2.5} />
                Logout
              </button>
            </>
          ) : (
            <>
              <Link 
                to="/login" 
                onClick={closeMenu}
                className="bg-blue-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide text-center active:scale-95 transition-transform w-full"
              >
                Login
              </Link>
              <Link 
                to="/register" 
                onClick={closeMenu}
                className="bg-red-600 text-white px-6 py-3.5 rounded-xl font-bold text-sm uppercase tracking-wide text-center active:scale-95 transition-transform w-full"
              >
                Sign Up
              </Link>
            </>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;