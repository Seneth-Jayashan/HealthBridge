import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequireRole from '../components/auth/RequireRole';

// Import Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import ProviderNetwork from '../pages/admin/Providers';
import PatientDirectory from '../pages/admin/Patients';
import BillingDashboard from '../pages/admin/Billing';
import PlatformAnalytics from '../pages/admin/Analytics';
import SecurityAudits from '../pages/admin/Security';
import GlobalSettings from '../pages/admin/Settings';

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Protects all nested routes ensuring ONLY Admins can access them */}
      <Route element={<RequireRole allowedRoles={['Admin']} />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="providers" element={<ProviderNetwork />} />
        <Route path="patients" element={<PatientDirectory />} />
        <Route path="billing" element={<BillingDashboard />} />
        <Route path="analytics" element={<PlatformAnalytics />} />
        <Route path="security" element={<SecurityAudits />} />
        <Route path="settings" element={<GlobalSettings />} />
      </Route>
    </Routes>
  );
}