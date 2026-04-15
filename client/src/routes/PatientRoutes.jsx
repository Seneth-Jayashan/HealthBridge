import React from 'react';
import { Routes, Route } from 'react-router-dom';
import RequireRole from '../components/auth/RequireRole';
import RequirePatientProfileComplete from '../components/patients/RequirePatientProfileComplete';

// Import Patient Pages
import PatientDashboard from '../pages/patient/Dashboard';
import MedicalReports from '../pages/patient/MedicalReports';
import PatientTelehealth from '../pages/patient/Telehealth';
// import PatientAppointments from '../pages/patient/Appointments'; // Ready for when you build it!
import PatientProfile from '../pages/patient/Profile';

import BookAppointment from '../pages/patient/appointment/BookAppointment';
import MyAppointments from '../pages/patient/appointment/MyAppointments';

export default function PatientRoutes() {
  return (
    <Routes>
      {/* Protects all nested routes ensuring ONLY Patients can access them */}
      <Route element={<RequireRole allowedRoles={['Patient']} />}>
        <Route element={<RequirePatientProfileComplete />}>
          {/* The path "dashboard" combines with the parent to become "/patient/dashboard" */}
          <Route path="dashboard" element={<PatientDashboard />} />
          <Route path="reports" element={<MedicalReports />} />
          <Route path="telehealth" element={<PatientTelehealth />} />

          <Route path="appointment/book" element={<BookAppointment />} />
          <Route path="appointment/my" element={<MyAppointments />} />

          {/* Future routes drop in perfectly here: */}
          {/* <Route path="appointments" element={<PatientAppointments />} /> */}
          {/* <Route path="records" element={<PatientRecords />} /> */}
          <Route path="profile" element={<PatientProfile />} />
        </Route>
      </Route>
    </Routes>
  );
}