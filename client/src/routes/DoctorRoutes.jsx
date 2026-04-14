import React from "react";
import { Routes, Route } from "react-router-dom";
import RequireRole from "../components/auth/RequireRole";
import RequireDoctorApproved from "../components/auth/RequireDoctorApproved";

// Import Doctor Pages
import DoctorDashboard from "../pages/doctor/Dashboard";
import DoctorRequest from "../pages/doctor/Request";
import DoctorTelehealth from "../pages/doctor/Telehealth";
import CreateSession from "../pages/doctor/CreateSession";

export default function DoctorRoutes() {
  return (
    <Routes>
      {/* Protects all nested routes ensuring ONLY Doctors can access them */}
      <Route element={<RequireRole allowedRoles={["Doctor"]} />}>
        <Route path="request" element={<DoctorRequest />} />

        <Route element={<RequireDoctorApproved />}>
          <Route path="dashboard" element={<DoctorDashboard />} />
          <Route path="create-session" element={<CreateSession />} />
          <Route path="telehealth" element={<DoctorTelehealth />} />
        </Route>

        {/* Future routes: */}
        {/* <Route path="schedule" element={<DoctorSchedule />} /> */}
      </Route>
    </Routes>
  );
}
