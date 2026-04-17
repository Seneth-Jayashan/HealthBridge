import React, { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { 
  Shield, Users, Activity, CreditCard, Stethoscope, BarChart3, 
  Settings, LogOut, ChevronLeft, ChevronRight, Menu, X 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const navItems = [
  { label: 'System Overview', to: '/admin/dashboard', icon: Activity },
  { label: 'Provider Network', to: '/admin/providers', icon: Stethoscope },
  { label: 'Patient Directory', to: '/admin/patients', icon: Users },
  { label: 'Financial & Billing', to: '/admin/billing', icon: CreditCard },
  { label: 'Security Audits', to: '/admin/security', icon: Shield },
];

const AdminSidebar = () => {
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

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'AD';

  return (
    <>
      {/* Mobile Top Bar (Dark Theme) */}
      <div className="md:hidden flex items-center justify-between bg-slate-950 border-b border-slate-800 px-5 py-4 sticky top-0 z-[40] w-full">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg shadow-md shadow-blue-900/20">
            <Activity className="text-white" size={18} />
          </div>
          <span className="text-lg font-black tracking-tight text-white">
            Health<span className="text-blue-500">Bridge</span>
          </span>
        </div>
        <button 
          onClick={() => setIsOpen(true)} 
          className="p-2 -mr-2 text-slate-400 hover:bg-slate-900 active:bg-slate-800 rounded-lg transition-colors"
          aria-label="Open Menu"
        >
          <Menu size={26} />
        </button>
      </div>

      {/* Mobile Overlay */}
      <div 
        className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[50] md:hidden transition-opacity duration-300 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={closeMobileSidebar}
      />

      {/* Main Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-[60] bg-slate-950 border-r border-slate-800 flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-[4px_0_24px_rgba(0,0,0,0.2)] text-slate-300
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:static md:h-screen md:top-0
        ${isCollapsed ? 'md:w-20' : 'md:w-72'}
        w-[280px] sm:w-[320px]
      `}>
        
        {/* Desktop Collapse Toggle */}
        <button 
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="hidden md:flex absolute -right-3 top-8 bg-slate-900 border border-slate-700 text-slate-400 rounded-full p-1.5 shadow-md hover:text-blue-500 hover:border-blue-500/50 transition-colors z-50"
        >
          {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
        </button>

        {/* Brand & Logo Section */}
        <div className={`h-20 shrink-0 flex items-center border-b border-slate-800/60 overflow-hidden transition-all justify-between ${isCollapsed ? 'md:px-0 md:justify-center px-6' : 'px-6 gap-3'}`}>
          <Link to="/" className="flex items-center gap-3" onClick={closeMobileSidebar}>
            <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20 shrink-0 flex items-center justify-center">
              <Activity className="text-white" size={20} />
            </div>
            <span className={`text-xl font-black tracking-tight text-white whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>
              Health<span className="text-blue-500">Bridge</span>
            </span>
          </Link>
          <button onClick={closeMobileSidebar} className="md:hidden text-slate-500 hover:text-red-400 p-1">
            <X size={24} />
          </button>
        </div>

        {/* Admin Profile Card */}
        <div className={`py-6 shrink-0 border-b border-slate-800/60 transition-all ${isCollapsed ? 'md:px-3 px-5' : 'px-5'}`}>
          <div className={`flex items-center bg-slate-900 rounded-2xl border border-slate-800 transition-colors hover:bg-slate-800/80 cursor-pointer ${isCollapsed ? 'md:p-2 md:justify-center p-3 gap-3' : 'p-3 gap-3'}`}>
            <div className="h-10 w-10 shrink-0 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center font-black text-sm border border-slate-700 shadow-inner" title="System Admin">
              {initials}
            </div>
            <div className={`overflow-hidden ${isCollapsed ? 'md:hidden' : 'block'}`}>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white truncate">{user?.name || 'System Admin'}</p>
                <Shield size={14} className="text-blue-500 shrink-0" />
              </div>
              <p className="text-xs font-medium text-slate-500 truncate">{user?.email || 'admin@healthbridge.internal'}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <div className={`flex-1 overflow-y-auto custom-scrollbar py-6 ${isCollapsed ? 'md:px-3 px-4' : 'px-4'}`}>
          <p className={`px-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>
            Command Center
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
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                      : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
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
        <div className={`p-4 shrink-0 border-t border-slate-800/60 bg-slate-950 ${isCollapsed ? 'md:flex md:justify-center' : ''}`}>
          <button 
            onClick={handleLogout}
            title={isCollapsed ? "Terminate Session" : ""}
            className={`rounded-xl py-3 text-sm font-bold flex items-center text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20 ${isCollapsed ? 'md:px-3 md:justify-center w-full px-4 gap-3' : 'w-full px-4 gap-3'}`}
          >
            <LogOut size={18} strokeWidth={2.5} className="shrink-0" />
            <span className={`whitespace-nowrap ${isCollapsed ? 'md:hidden' : 'block'}`}>Terminate Session</span>
          </button>
        </div>
        
      </aside>
    </>
  );
};

export default AdminSidebar;