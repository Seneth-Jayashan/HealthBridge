import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequireRole from '../components/auth/RequireRole';

// Import Doctor Pages
import DoctorDashboard from '../pages/doctor/Dashboard';

export default function DoctorRoutes() {
  return (
    <Routes>
      {/* Protects all nested routes ensuring ONLY Doctors can access them */}
      <Route element={<RequireRole allowedRoles={['Doctor']} />}>
        
        <Route path="dashboard" element={<DoctorDashboard />} />
        
        {/* Future routes: */}
        {/* <Route path="schedule" element={<DoctorSchedule />} /> */}
        {/* <Route path="telehealth" element={<LiveTelehealth />} /> */}
        
      </Route>
    </Routes>
  );
}