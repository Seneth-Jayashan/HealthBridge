import React from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { 
  Shield, 
  Users, 
  Activity, 
  CreditCard, 
  Stethoscope, 
  BarChart3, 
  Settings,
  LogOut 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext'; // Import your AuthContext

const navItems = [
  { label: 'System Overview', to: '/admin/dashboard', icon: Activity },
  { label: 'Provider Network', to: '/admin/providers', icon: Stethoscope },
  { label: 'Patient Directory', to: '/admin/patients', icon: Users },
  { label: 'Financial & Billing', to: '/admin/billing', icon: CreditCard },
  { label: 'Platform Analytics', to: '/admin/analytics', icon: BarChart3 },
  { label: 'Security Audits', to: '/admin/security', icon: Shield },
  { label: 'Global Settings', to: '/admin/settings', icon: Settings },
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth(); // Pull user and logout securely from context

  const handleLogout = () => {
    logout(); // Clears cookies/state via context
    navigate('/login'); // Clean SPA routing without full page reload
  };

  // Extract initials for the avatar (e.g., "Admin Super" -> "AS")
  const initials = user?.name 
    ? user.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() 
    : 'AD';

  return (
    <aside className="w-72 bg-slate-950 border-r border-slate-800 hidden md:flex md:flex-col shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-20 h-screen sticky top-0 text-slate-300">
      
      {/* Brand & Logo Section */}
      <div className="h-20 px-6 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-900/20">
            <Activity className="text-white" size={20} />
          </div>
          <Link to="/" className="text-xl font-black tracking-tight text-white">
            Health<span className="text-blue-500">Bridge</span>
          </Link>
        </div>
      </div>

      {/* Admin Profile Card */}
      <div className="px-5 py-6 border-b border-slate-800/60">
        <div className="flex items-center gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800 transition-colors hover:bg-slate-800 cursor-pointer">
          <div className="h-10 w-10 shrink-0 rounded-full bg-slate-800 text-blue-400 flex items-center justify-center font-black text-sm border border-slate-700 shadow-inner">
            {initials}
          </div>
          <div className="overflow-hidden">
            <div className="flex items-center gap-2">
              <p className="text-sm font-bold text-white truncate">
                {user?.name || 'System Admin'}
              </p>
              <Shield size={14} className="text-blue-500 shrink-0" />
            </div>
            <p className="text-xs font-medium text-slate-500 truncate">
              {user?.email || 'admin@healthbridge.internal'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="flex-1 overflow-y-auto py-6 px-4">
        <p className="px-4 text-[11px] font-bold uppercase tracking-widest text-slate-500 mb-3">
          Command Center
        </p>
        <nav className="space-y-1.5">
          {navItems.map((item) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `w-full rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-3 transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
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
      <div className="p-4 border-t border-slate-800/60 bg-slate-950">
        <button 
          onClick={handleLogout}
          className="w-full rounded-xl px-4 py-3 text-sm font-bold flex items-center gap-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors border border-transparent hover:border-red-500/20"
        >
          <LogOut size={18} strokeWidth={2.5} />
          Terminate Session
        </button>
      </div>
      
    </aside>
  );
};

export default AdminSidebar;