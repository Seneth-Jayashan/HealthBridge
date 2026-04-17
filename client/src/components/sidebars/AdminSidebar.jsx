import React, { useState } from 'react';
import { data, Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Shield, Users, Activity, CreditCard, Stethoscope, BarChart3, 
  Settings, LogOut, ChevronLeft, ChevronRight 
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
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'AD';

  return (
    <aside className={`${isCollapsed ? 'w-20' : 'w-72'} bg-slate-950 border-r border-slate-800 hidden md:flex md:flex-col shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-20 h-screen sticky top-0 text-slate-300 transition-all duration-300 ease-in-out`}>
      
      {/* Floating Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3 top-8 bg-slate-900 border border-slate-700 text-slate-400 rounded-full p-1.5 shadow-md hover:text-blue-500 hover:border-blue-500/50 transition-colors z-50"
      >
        {isCollapsed ? <ChevronRight size={14} strokeWidth={3} /> : <ChevronLeft size={14} strokeWidth={3} />}
      </button>

      {/* Brand & Logo Section */}
      <div className={`h-20 flex items-center border-b border-slate-800/60 overflow-hidden transition-all ${isCollapsed ? 'px-0 justify-center' : 'px-6 gap-3'}`}>
        <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20 shrink-0">
          <Activity className="text-white" size={20} />
        </div>
        {!isCollapsed && (
          <Link to="/" className="text-xl font-black tracking-tight text-white whitespace-nowrap">
            Health<span className="text-blue-500">Bridge</span>
          </Link>
        )}
      </div>

      {/* Admin Profile Card */}
      <div className={`py-6 border-b border-slate-800/60 transition-all ${isCollapsed ? 'px-3' : 'px-5'}`}>
        <div className={`flex items-center bg-slate-900 rounded-2xl border border-slate-800 hover:bg-slate-800 cursor-pointer ${isCollapsed ? 'p-2 justify-center' : 'p-3 gap-3'}`}>
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center font-black text-sm border border-slate-700 shadow-inner" title="System Admin">
            {initials}
          </div>
          {!isCollapsed && (
            <div className="overflow-hidden">
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-white truncate">{user?.name || 'System Admin'}</p>
                <Shield size={14} className="text-blue-500 shrink-0" />
              </div>
              <p className="text-xs font-medium text-slate-500 truncate">{user?.email || 'admin@healthbridge.internal'}</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Menu */}
      <div className={`flex-1 overflow-y-auto py-6 ${isCollapsed ? 'px-3' : 'px-4'}`}>
        {!isCollapsed && (
          <p className="px-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3 whitespace-nowrap">
            Command Center
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
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
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
      <div className={`p-4 border-t border-slate-800/60 bg-slate-950 ${isCollapsed ? 'flex justify-center' : ''}`}>
        <button 
          onClick={handleLogout}
          title={isCollapsed ? "Terminate Session" : ""}
          className={`rounded-xl py-3 text-sm font-bold flex items-center text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20 ${isCollapsed ? 'px-3 justify-center' : 'w-full px-4 gap-3'}`}
        >
          <LogOut size={18} strokeWidth={2.5} className="shrink-0" />
          {!isCollapsed && <span className="whitespace-nowrap">Terminate Session</span>}
        </button>
      </div>
      
    </aside>
  );
};

export default AdminSidebar;