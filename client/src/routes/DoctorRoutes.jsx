import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequireRole from '../components/auth/RequireRole';
// Make sure this path matches where you saved the file!
import RequireDoctorApproved from '../components/doctor/RequireDoctorApproved';

import DoctorDashboard from '../pages/doctor/Dashboard';
import DoctorRequest from '../pages/doctor/Request';
import AppointmentList from '../pages/doctor/appointment/AppointmentList';
import DoctorTelehealth from "../pages/doctor/Telehealth";

export default function DoctorRoutes() {
  return (
    <Routes>
      {/* Level 1: Must be a Doctor */}
      <Route element={<RequireRole allowedRoles={['Doctor']} />}>
        
        <Route path="request" element={<DoctorRequest />} />
        
        {/* Level 2: Must be a Doctor AND Approved */}
        <Route element={<RequireDoctorApproved />}>
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="appointment" element={<AppointmentList />} />
          <Route path="telehealth" element={<DoctorTelehealth />} />
        </Route>
        
      {/* Protects all nested routes ensuring ONLY Doctors can access them */}
      </Route>
    </Routes>
  );
}
