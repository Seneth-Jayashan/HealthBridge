import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequireRole from '../components/auth/RequireRole';

// Import Doctor Pages
import DoctorDashboard from '../pages/doctor/Dashboard';
import DoctorTelehealth from '../pages/doctor/Telehealth';

export default function DoctorRoutes() {
  return (
    <Routes>
      {/* Protects all nested routes ensuring ONLY Doctors can access them */}
      <Route element={<RequireRole allowedRoles={['Doctor']} />}>
        
        <Route path="dashboard" element={<DoctorDashboard />} />
        <Route path="telehealth" element={<DoctorTelehealth />} />
        
        {/* Future routes: */}
        {/* <Route path="schedule" element={<DoctorSchedule />} /> */}
        
      </Route>
    </Routes>
  );
}