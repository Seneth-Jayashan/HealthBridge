import React from 'react';
import { Link, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { Activity } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PatientSidebar from '../components/sidebars/PatientSidebar';
import DoctorSidebar from '../components/sidebars/DoctorSidebar';
import AdminSidebar from '../components/sidebars/AdminSidebar';

const sidebarByRole = {
  Patient: PatientSidebar,
  Doctor: DoctorSidebar,
  Admin: AdminSidebar,
};

const DashboardLayout = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  if (!isAuthenticated || !user?.role) {
    return <Navigate to="/login" replace />;
  }

  const Sidebar = sidebarByRole[user.role] || PatientSidebar;

  const onLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900">
      <div className="flex min-h-screen">
        <Sidebar user={user} />

        <div className="flex-1">
          <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-20">
            <marquee className="text-sm font-medium text-slate-600" behavior="scroll" direction="left" scrollamount="3">
              Welcome back, {user.name}! Your secure HealthBridge dashboard is ready.
            </marquee>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 bg-red-600 text-white border border-red-600 px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-wide hover:bg-red-700 hover:border-red-700 transition-all hover:-translate-y-0.5 active:scale-95"
            >
              <Activity size={16} strokeWidth={2.5} />
              Logout
            </button>
          </header>

          <main className="p-6 md:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout;
