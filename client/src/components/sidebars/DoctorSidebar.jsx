import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Stethoscope, 
  CalendarClock, 
  ClipboardList, 
  Users, 
  Video,
  FileText,
  Activity,
  LogOut,
  BadgeCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // Import your AuthContext

const navItems = [
  { label: 'Clinical Overview', to: '/doctor/dashboard', icon: Activity },
  { label: 'Live Telehealth', to: '/doctor/telehealth', icon: Video },
  { label: 'My Schedule', to: '/doctor/schedule', icon: CalendarClock },
  { label: 'Patient Directory', to: '/doctor/patients', icon: Users },
  { label: 'E-Prescriptions', to: '/doctor/prescriptions', icon: FileText },
  { label: 'Consult Notes', to: '/doctor/notes', icon: ClipboardList },
];

const DoctorSidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Pull user and logout securely from context

  const handleLogout = () => {
    logout(); // Clears cookies/state via context
    navigate('/login'); // Clean SPA routing without full page reload
  };

  // Extract initials and handle "Dr." prefix dynamically
  const name = user?.name || 'Doctor Name';
  const displayName = name.toLowerCase().startsWith('dr.') ? name : `Dr. ${name}`;
  
  const initials = name
    .replace(/^Dr\.\s*/i, '') // Remove "Dr." for the initials
    .split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'MD';

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-800 hidden md:flex md:flex-col shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-20 h-screen sticky top-0 text-slate-200">
      
      {/* Brand & Logo Section */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div className="bg-teal-600 p-2 rounded-xl shadow-lg shadow-teal-900/20">
            <Stethoscope className="text-white" size={20} />
          </div>
          <Link to="/" className="text-xl font-black tracking-tight text-white">
            Health<span className="text-teal-500">Bridge</span>
          </Link>
        </div>
      </div>

      {/* Provider Profile Card */}
      <div className="px-5 py-6 border-b border-slate-800/80">
        <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-2xl border border-slate-700/50 transition-colors hover:bg-slate-800 cursor-pointer">
          <div className="h-10 w-10 shrink-0 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center font-black text-sm border border-teal-500/20 shadow-inner">
            {initials}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-bold text-white truncate">
                {displayName}
              </p>
              <BadgeCheck size={14} className="text-teal-500 shrink-0" title="Board Certified" />
            </div>
            <p className="text-xs font-medium text-slate-400 truncate">
              {user?.specialty || 'General Practitioner'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <p className="px-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
          Provider Console
        </p>
        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `w-full rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-3 transition-all duration-200 ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
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
      <div className="p-4 border-t border-slate-800/80 bg-slate-900">
        <button 
          onClick={handleLogout}
          className="w-full rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20"
        >
          <LogOut size={18} strokeWidth={2.5} />
          End Shift
        </button>
      </div>
      
    </aside>
  );
};

export default DoctorSidebar;