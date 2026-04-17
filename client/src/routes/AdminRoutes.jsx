import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequireRole from '../components/auth/RequireRole';

// Import Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';
import ProviderNetwork from '../pages/admin/Providers';
import PatientDirectory from '../pages/admin/Patients';
import BillingDashboard from '../pages/admin/Billing';
import SecurityAudits from '../pages/admin/Security';

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Protects all nested routes ensuring ONLY Admins can access them */}
      <Route element={<RequireRole allowedRoles={['Admin']} />}>
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="providers" element={<ProviderNetwork />} />
        <Route path="patients" element={<PatientDirectory />} />
        <Route path="billing" element={<BillingDashboard />} />
        <Route path="security" element={<SecurityAudits />} />
      </Route>
    </Routes>
  );
}