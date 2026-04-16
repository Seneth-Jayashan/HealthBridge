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
    <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-white border-r border-slate-100 hidden md:flex md:flex-col shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 h-screen sticky top-0 transition-all duration-300 ease-in-out`}>
      
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-white border border-slate-200 text-slate-500 rounded-full p-1.5 shadow-sm hover:text-blue-600 hover:border-blue-300 transition-colors z-50"
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
      </button>

      {/* Brand & Logo Section */}
      <div className={`h-20 flex items-center border-b border-slate-50 overflow-hidden transition-all ${isCollapsed ? 'px-0 justify-center' : 'px-6 gap-3'}`}>
        <div className="bg-blue-700 p-2 rounded-xl shadow-md shadow-blue-700/20 shrink-0">
          <Stethoscope className="text-white" size={20} />
        </div>
        {!isCollapsed && (
          <Link to="/" className="text-xl font-black tracking-tight text-slate-900 whitespace-nowrap">
            Health<span className="text-blue-700">Bridge</span>
          </Link>
        )}
      </div>

      {/* Provider Profile Card */}
      <div className={`py-6 border-b border-slate-100 transition-all ${isCollapsed ? 'px-3' : 'px-5'}`}>
        <div className={`flex items-center bg-slate-50 rounded-2xl border border-slate-100 hover:bg-slate-100 cursor-pointer ${isCollapsed ? 'p-2 justify-center' : 'p-3 gap-3'}`}>
          <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm border border-blue-200" title={displayName}>
            {initials}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                <BadgeCheck size={14} className="text-blue-700 shrink-0" title="Board Certified" />
              </div>
              <p className="text-xs font-semibold text-slate-500 truncate">{user?.specialty || 'General Practitioner'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className={`flex-1 overflow-y-auto py-6 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {!isCollapsed && (
          <p className="px-4 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 whitespace-nowrap">
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
                    ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-700'
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
      <div className={`p-4 border-t border-slate-100 bg-slate-50/50 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button 
          onClick={handleLogout}
          title={isCollapsed ? "End Shift" : ""}
          className={`rounded-xl py-3 text-sm font-bold flex items-center text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors ${isCollapsed ? 'px-3 justify-center' : 'w-full px-4 gap-3'}`}
        >
          <LogOut size={18} strokeWidth={2.5} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">End Shift</span>}
        </button>
      </div>
      
    </aside>
  );
};

export default DoctorSidebar;