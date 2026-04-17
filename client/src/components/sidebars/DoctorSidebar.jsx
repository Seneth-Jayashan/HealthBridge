import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Stethoscope, Users, Video, Activity, LogOut, BadgeCheck, 
  ChevronLeft, ChevronRight, CalendarCheck2, UserRound,
  CreditCard, Menu, X
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
  const location = useLocation();
  const { user, logout } = useAuth();
  
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location]);

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const closeMobileSidebar = () => setIsOpen(false);

  const name = user?.name || 'Doctor Name';
  const displayName = name.toLowerCase().startsWith('dr.') ? name : `Dr. ${name}`;
  const initials = name.replace(/^Dr\.\s*/i, '').split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() || 'MD';

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-100 px-5 py-4 sticky top-0 z-[40] w-full">
        <div className="flex items-center gap-3">
          <div className="bg-blue-700 p-2 rounded-lg shadow-md shadow-blue-700/20">
            <Stethoscope className="text-white" size={18} />
          </div>
          <span className="text-lg font-black tracking-tight text-slate-900">
            Health<span className="text-blue-700">Bridge</span>
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-2 -mr-2 text-slate-600 active:bg-slate-100 rounded-full transition-colors"
          aria-label="Open Menu"
        >
          <Menu size={26} />
        </button>
      </div>

      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-[50] md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileSidebar}
      />

      {/* Main Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[60] bg-white border-r border-slate-100 flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.02)]
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen md:top-0
        ${isCollapsed ? 'md:w-20' : 'md:w-72'}
        w-[280px] sm:w-[320px]
      `}>
        
        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-8 bg-white border border-slate-200 text-slate-500 rounded-full p-1.5 shadow-sm hover:text-blue-600 hover:border-blue-300 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>

        {/* Brand & Logo Section */}
        <div className={`h-20 shrink-0 flex items-center border-b border-slate-50 overflow-hidden transition-all justify-between ${isCollapsed ? 'md:px-0 md:justify-center px-6' : 'px-6 gap-3'}`}>
          <Link to="/" className="flex items-center gap-3" onClick={closeMobileSidebar}>
            <div className="bg-blue-700 p-2 rounded-xl shadow-md shadow-blue-700/20 shrink-0 flex items-center justify-center">
              <Stethoscope className="text-white" size={20} />
            </div>
            <span className={`text-xl font-black tracking-tight text-slate-900 whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>
              Health<span className="text-blue-700">Bridge</span>
            </span>
          </Link>
          <button onClick={closeMobileSidebar} className="md:hidden text-slate-400 hover:text-red-500 p-1">
            <X size={24} />
          </button>
        </div>

        {/* Provider Profile Card */}
        <div className={`py-6 shrink-0 border-b border-slate-100 transition-all ${isCollapsed ? 'md:px-3 px-5' : 'px-5'}`}>
          <div className={`flex items-center bg-slate-50 rounded-2xl border border-slate-100 transition-colors hover:bg-slate-100 cursor-pointer ${isCollapsed ? 'md:p-2 md:justify-center p-3 gap-3' : 'p-3 gap-3'}`}>
            <div className="h-10 w-10 shrink-0 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-black text-sm border border-blue-200" title={displayName}>
              {initials}
            </div>
            <div className={`overflow-hidden ${isCollapsed ? 'md:hidden' : 'block'}`}>
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-bold text-slate-900 truncate">{displayName}</p>
                <BadgeCheck size={14} className="text-blue-700 shrink-0" title="Board Certified" />
              </div>
              <p className="text-xs font-semibold text-slate-500 truncate">{user?.specialty || 'General Practitioner'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar py-6 ${isCollapsed ? 'md:px-3 px-4' : 'px-4'}`}>
          <p className={`px-4 text-[10px] font-bold uppercase tracking-[0.15em] text-slate-400 mb-4 whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>
            Provider Console
          </p>
          <nav className="space-y-1.5">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                onClick={closeMobileSidebar}
                title={isCollapsed ? item.label : ""}
                className={({ isActive }) =>
                  `w-full rounded-xl py-3 text-sm font-bold flex items-center transition-all duration-200 ${isCollapsed ? 'md:px-0 md:justify-center px-4 gap-3' : 'px-4 gap-3'} ${
                    isActive
                      ? 'bg-blue-700 text-white shadow-lg shadow-blue-700/20'
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

        {/* Footer / Logout Section */}
        <div className={`p-4 shrink-0 border-t border-slate-100 bg-slate-50/50 ${isCollapsed ? 'md:flex md:justify-center' : ''}`}>
          <button 
            onClick={handleLogout}
            title={isCollapsed ? "End Shift" : ""}
            className={`rounded-xl py-3 text-sm font-bold flex items-center text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors ${isCollapsed ? 'md:px-3 md:justify-center w-full px-4 gap-3' : 'w-full px-4 gap-3'}`}
          >
            <LogOut size={18} strokeWidth={2.5} className="shrink-0" />
            <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>End Shift</span>
          </button>
        </div>
        
      </aside>
    </>
  );
};

export default DoctorSidebar;