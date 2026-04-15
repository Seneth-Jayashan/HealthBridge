import React, { useState } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Activity, Calendar, MessageCircle, UserRound, LogOut, 
  HeartPulse, FileText, ChevronLeft, ChevronRight, Menu, X,
  CalendarPlus, CalendarCheck, ChevronDown
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; 

const navItems = [
  { label: 'Overview', to: '/patient/dashboard', icon: Activity },
  { label: 'Appointments', to: '/patient/appointments', icon: Calendar },
  { label: 'Medical Reports', to: '/patient/reports', icon: HeartPulse },
  { label: 'Prescriptions', to: '/patient/prescriptions', icon: FileText },
  { label: 'Messages', to: '/patient/messages', icon: MessageCircle },
  { label: 'Profile Settings', to: '/patient/profile', icon: UserRound },
];

const appointmentSubItems = [
  { label: 'Book Appointment', to: '/patient/appointment/book', icon: CalendarPlus },
  { label: 'My Appointments', to: '/patient/appointment/my', icon: CalendarCheck },
];

const PatientSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Auto-open dropdown if current path is an appointment page
  const isAppointmentActive = location.pathname.startsWith('/patient/appointment');
  const [appointmentOpen, setAppointmentOpen] = useState(isAppointmentActive);

  const handleLogout = () => {
    logout(); 
    navigate('/login'); 
  };

  const closeMobileSidebar = () => setIsOpen(false);

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'PT';

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-100 px-6 py-4 sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="bg-blue-700 p-2 rounded-lg shadow-md shadow-blue-700/20">
            <Activity className="text-white" size={18} />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900">
            Health<span className="text-blue-700">Bridge</span>
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(true)} 
          className="text-slate-500 hover:text-slate-800 transition-colors p-1"
        >
          <Menu size={28} />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={closeMobileSidebar}
        />
      )}

      {/* Main Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen md:top-0
        ${isCollapsed ? 'md:w-20 w-72' : 'w-72'}
      `}>
        
        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => {
            setIsCollapsed(!isCollapsed);
            if (!isCollapsed) setAppointmentOpen(false); // close dropdown when collapsing
          }}
          className="hidden md:block absolute -right-3 top-8 bg-white border border-slate-200 text-slate-500 rounded-full p-1.5 shadow-sm hover:text-blue-600 hover:border-blue-300 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>

        {/* Brand */}
        <div className={`h-20 flex items-center border-b border-slate-50 overflow-hidden transition-all justify-between ${isCollapsed ? 'md:px-0 md:justify-center px-6' : 'px-6 gap-3'}`}>
          <Link to="/" className="flex items-center gap-3" onClick={closeMobileSidebar}>
            <div className="bg-blue-700 p-2 rounded-xl shadow-md shadow-blue-700/20 shrink-0 flex items-center justify-center">
              <Activity className="text-white" size={20} />
            </div>
            <span className={`text-xl font-black tracking-tight text-slate-900 whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>
              Health<span className="text-blue-700">Bridge</span>
            </span>
          </Link>
          <button onClick={closeMobileSidebar} className="md:hidden text-slate-400 hover:text-red-500 p-1">
            <X size={24} />
          </button>
        </div>

        {/* User Profile */}
        <div className={`py-6 border-b border-slate-100 transition-all ${isCollapsed ? 'md:px-3 px-5' : 'px-5'}`}>
          <div className={`flex items-center bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100 cursor-pointer ${isCollapsed ? 'md:p-2 md:justify-center p-3 gap-3' : 'p-3 gap-3'}`}>
            <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm border border-blue-200" title={user?.name}>
              {initials}
            </div>
            <div className={`overflow-hidden ${isCollapsed ? 'md:hidden' : 'block'}`}>
              <p className="text-sm font-bold text-slate-900 truncate">{user?.name || 'Patient Name'}</p>
              <p className="text-xs font-semibold text-slate-500 truncate">{user?.email || 'patient@healthbridge.com'}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className={`flex-1 overflow-y-auto py-6 ${isCollapsed ? 'md:px-3 px-4' : 'px-4'}`}>
          <p className={`px-4 text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>
            Patient Portal
          </p>
          <nav className="space-y-1.5">

            {/* Overview */}
            <NavLink
              to="/patient/dashboard"
              onClick={closeMobileSidebar}
              className={({ isActive }) =>
                `w-full rounded-xl py-3 text-sm font-bold flex items-center transition-all duration-200 ${isCollapsed ? 'md:px-0 md:justify-center px-4 gap-3' : 'px-4 gap-3'} ${
                  isActive ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20' : 'text-slate-500 hover:bg-slate-50 hover:text-blue-700'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Activity size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                  <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>Overview</span>
                </>
              )}
            </NavLink>

            {/* Appointments Dropdown */}
            <div>
              {/* Dropdown trigger */}
              <button
                onClick={() => !isCollapsed && setAppointmentOpen((prev) => !prev)}
                title={isCollapsed ? 'Appointments' : ''}
                className={`w-full rounded-xl py-3 text-sm font-bold flex items-center transition-all duration-200
                  ${isCollapsed ? 'md:px-0 md:justify-center px-4 gap-3' : 'px-4 gap-3'}
                  ${isAppointmentActive
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-500 hover:bg-slate-50 hover:text-blue-700'
                  }`}
              >
                <Calendar size={18} strokeWidth={isAppointmentActive ? 2.5 : 2} className="shrink-0" />
                <span className={`flex-1 text-left whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>
                  Appointments
                </span>
                {!isCollapsed && (
                  <ChevronDown
                    size={15}
                    className={`shrink-0 transition-transform duration-200 ${appointmentOpen ? 'rotate-180' : ''}`}
                  />
                )}
              </button>

              {/* Sub-items */}
              {!isCollapsed && appointmentOpen && (
                <div className="mt-1 ml-4 pl-4 border-l-2 border-slate-100 space-y-1">
                  {appointmentSubItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      onClick={closeMobileSidebar}
                      className={({ isActive }) =>
                        `w-full rounded-xl py-2.5 px-3 text-sm font-semibold flex items-center gap-2.5 transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                            : 'text-slate-500 hover:bg-slate-50 hover:text-blue-700'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <item.icon size={15} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                          <span className="whitespace-nowrap">{item.label}</span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              )}

              {/* Collapsed: show sub-items as icon-only tooltips */}
              {isCollapsed && (
                <div className="hidden md:flex flex-col items-center gap-1 mt-1">
                  {appointmentSubItems.map((item) => (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      title={item.label}
                      className={({ isActive }) =>
                        `w-full rounded-xl py-2.5 flex justify-center transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                            : 'text-slate-400 hover:bg-slate-50 hover:text-blue-700'
                        }`
                      }
                    >
                      {({ isActive }) => (
                        <item.icon size={16} strokeWidth={isActive ? 2.5 : 2} />
                      )}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>

            {/* Rest of nav items */}
            {navItems.slice(1).map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={closeMobileSidebar}
                title={isCollapsed ? item.label : ''}
                className={({ isActive }) =>
                  `w-full rounded-xl py-3 text-sm font-bold flex items-center transition-all duration-200 ${isCollapsed ? 'md:px-0 md:justify-center px-4 gap-3' : 'px-4 gap-3'} ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-md shadow-blue-700/20'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-blue-700'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon size={18} strokeWidth={isActive ? 2.5 : 2} className="shrink-0" />
                    <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>{item.label}</span>
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Logout */}
        <div className={`p-4 border-t border-slate-100 bg-slate-50/50 ${isCollapsed ? 'md:flex md:justify-center' : ''}`}>
          <button 
            onClick={handleLogout}
            title={isCollapsed ? 'Secure Logout' : ''}
            className={`rounded-xl py-3 text-sm font-bold flex items-center text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors ${isCollapsed ? 'md:px-3 md:justify-center w-full px-4 gap-3' : 'w-full px-4 gap-3'}`}
          >
            <LogOut size={18} strokeWidth={2.5} className="shrink-0" />
            <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>Secure Logout</span>
          </button>
        </div>
        
      </aside>
    </>
  );
};

export default PatientSidebar;