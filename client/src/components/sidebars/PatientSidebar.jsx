import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Calendar, 
  MessageCircle, 
  UserRound, 
  LogOut, 
  HeartPulse, 
  FileText 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // Adjust path if necessary

const navItems = [
  { label: 'Overview', to: '/patient/dashboard', icon: Activity },
  { label: 'Appointments', to: '/patient/appointments', icon: Calendar },
  { label: 'Medical Records', to: '/patient/records', icon: HeartPulse },
  { label: 'Prescriptions', to: '/patient/prescriptions', icon: FileText },
  { label: 'Messages', to: '/patient/messages', icon: MessageCircle },
  { label: 'Profile Settings', to: '/patient/profile', icon: UserRound },
];

const PatientSidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout(); // Clears cookies/state via context
    navigate('/login'); // Clean SPA routing without full page reload
  };

  // Extract initials for the avatar placeholder (e.g., "John Doe" -> "JD")
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'PT';

  return (
    <aside className="w-72 bg-white border-r border-slate-100 hidden md:flex md:flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 h-screen sticky top-0">
      
      {/* Brand & Logo Section */}
      <div className="h-20 px-6 flex items-center gap-3 border-b border-slate-50">
        <div className="bg-blue-700 p-2 rounded-xl shadow-md shadow-blue-700/20">
          <Activity className="text-white" size={20} />
        </div>
        <Link to="/" className="text-xl font-black tracking-tight text-slate-900">
          Health<span className="text-blue-700">Bridge</span>
        </Link>
      </div>

      {/* User Profile Card */}
      <div className="px-5 py-6 border-b border-slate-100">
        <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100 cursor-pointer">
          <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm border border-blue-200">
            {initials}
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-bold text-slate-900 truncate">
              {user?.name || 'Patient Name'}
            </p>
            <p className="text-xs font-semibold text-slate-500 truncate">
              {user?.email || 'patient@healthbridge.com'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Patient Portal
        </p>
        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `w-full rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-3 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                  {item.label}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer / Logout Section */}
      <div className="p-4 border-t border-slate-100 bg-slate-50/50">
        <button 
          onClick={handleLogout}
          className="w-full rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-3 text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors"
        >
          <LogOut size={18} strokeWidth={2.5} />
          Secure Logout
        </button>
      </div>
      
    </aside>
  );
};

export default PatientSidebar;