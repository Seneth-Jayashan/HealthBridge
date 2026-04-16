import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Stethoscope, CalendarClock, ClipboardList, Users, Video, FileText, 
  Activity, LogOut, BadgeCheck, ChevronLeft, ChevronRight, CalendarCheck2, 
  UserRound,
  CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'Clinical Overview', to: '/doctor/dashboard', icon: Activity },
  { label: 'Appointments', to: '/doctor/appointment', icon: CalendarCheck2 },
  { label: 'Live Telehealth', to: '/doctor/telehealth', icon: Video },
  { label: 'My Schedule', to: '/doctor/schedule', icon: CalendarClock },
  { label: 'Patient Directory', to: '/doctor/patients', icon: Users },
  { label: 'My Payments', to: '/doctor/payments', icon: CreditCard },
  { label: 'Profile', to: '/doctor/profile', icon: UserRound },
];

const DoctorSidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const name = user?.name || 'Doctor Name';
  const displayName = name.toLowerCase().startsWith('dr.') ? name : `Dr. ${name}`;
  const initials = name.replace(/^Dr\.\s*/i, '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MD';

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-slate-900 border-r border-slate-800 hidden md:flex md:flex-col shadow-[4px_0_24px_rgba(0,0,0,0.15)] z-20 h-screen sticky top-0 text-slate-200 transition-all duration-300 ease-in-out`}>
      
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-slate-800 border border-slate-700 text-slate-400 rounded-full p-1.5 shadow-md hover:text-teal-400 hover:border-teal-500/50 transition-colors z-50"
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
      </button>

      {/* Brand & Logo Section */}
      <div className={`h-20 flex items-center border-b border-slate-800/80 overflow-hidden transition-all ${isCollapsed ? 'px-0 justify-center' : 'px-6 gap-3'}`}>
        <div className="bg-teal-600 p-2 rounded-xl shadow-lg shadow-teal-900/20 shrink-0">
          <Stethoscope className="text-white" size={20} />
        </div>
        {!isCollapsed && (
          <Link to="/" className="text-xl font-black tracking-tight text-white whitespace-nowrap">
            Health<span className="text-teal-500">Bridge</span>
          </Link>
        )}
      </div>

      {/* Provider Profile Card */}
      <div className={`py-6 border-b border-slate-800/80 transition-all ${isCollapsed ? 'px-3' : 'px-5'}`}>
        <div className={`flex items-center bg-slate-800/50 rounded-2xl border border-slate-700/50 hover:bg-slate-800 cursor-pointer ${isCollapsed ? 'p-2 justify-center' : 'p-3 gap-3'}`}>
          <div className="h-10 w-10 shrink-0 rounded-full bg-teal-500/10 text-teal-400 flex items-center justify-center font-black text-sm border border-teal-500/20 shadow-inner" title={displayName}>
            {initials}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-white truncate">{displayName}</p>
                <BadgeCheck size={14} className="text-teal-500 shrink-0" title="Board Certified" />
              </div>
              <p className="text-xs font-medium text-slate-400 truncate">{user?.specialty || 'General Practitioner'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className={`flex-1 overflow-y-auto py-6 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {!isCollapsed && (
          <p className="px-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 whitespace-nowrap">
            Provider Console
          </p>
        )}
        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              title={isCollapsed ? item.label : ""}
              className={({ isActive }) =>
                `w-full rounded-xl py-3 text-sm font-bold flex items-center transition-all duration-200 ${isCollapsed ? 'px-0 justify-center' : 'px-4 gap-3'} ${
                  isActive
                    ? 'bg-teal-600 text-white shadow-lg shadow-teal-900/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                  {!isCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      {/* Footer / Logout Section */}
      <div className={`p-4 border-t border-slate-800/80 bg-slate-900 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button 
          onClick={handleLogout}
          title={isCollapsed ? "End Shift" : ""}
          className={`rounded-xl py-3 text-sm font-bold flex items-center text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20 ${isCollapsed ? 'px-3 justify-center' : 'w-full px-4 gap-3'}`}
        >
          <LogOut size={18} strokeWidth={2.5} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">End Shift</span>}
        </button>
      </div>
      
    </aside>
  );
};

export default DoctorSidebar;