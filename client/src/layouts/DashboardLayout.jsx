import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PatientSidebar from '../components/sidebars/PatientSidebar';
import DoctorSidebar from '../components/sidebars/DoctorSidebar';
import AdminSidebar from '../components/sidebars/AdminSidebar';
import NotificationBell from '../components/notifications/NotificationBell';

const sidebarByRole = {
  Patient: PatientSidebar,
  Doctor: DoctorSidebar,
  Admin: AdminSidebar,
};

const DashboardLayout = () => {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user?.role) {
    return <Navigate to="/login" replace />;
  }

  const Sidebar = sidebarByRole[user.role] || PatientSidebar;

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-slate-50">
      <Sidebar />

      <main className="flex-1 w-full max-w-full overflow-x-hidden flex flex-col h-screen overflow-y-auto relative">
        <header className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur supports-[backdrop-filter]:bg-slate-50/80 px-3 md:px-6 pt-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0 rounded-xl bg-blue-700 text-white py-2 px-4 text-sm font-medium tracking-wide shadow-md shadow-blue-900/20 whitespace-nowrap overflow-hidden text-ellipsis">
              <marquee behavior="scroll" direction="left">
                Welcome to HealthBridge, {user.name}!
              </marquee>
            </div>
            <NotificationBell />
          </div>
        </header>
        <div className="md:p-10 w-full max-w-7xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;