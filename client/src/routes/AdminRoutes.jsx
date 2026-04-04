import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequireRole from '../components/auth/RequireRole';

// Import Admin Pages
import AdminDashboard from '../pages/admin/Dashboard';

export default function AdminRoutes() {
  return (
    <Routes>
      {/* Protects all nested routes ensuring ONLY Admins can access them */}
      <Route element={<RequireRole allowedRoles={['Admin']} />}>
        
        <Route path="dashboard" element={<AdminDashboard />} />
        
        {/* Future routes: */}
        {/* <Route path="providers" element={<ProviderNetwork />} /> */}
        {/* <Route path="analytics" element={<PlatformAnalytics />} /> */}
        
      </Route>
    </Routes>
  );
}