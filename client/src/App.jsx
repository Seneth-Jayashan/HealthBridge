import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Public Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';

// Auth
import RequireAuth from './components/auth/RequireAuth';
import { AuthProvider } from './context/AuthContext';

// Role Routes
import PatientRoutes from './routes/PatientRoutes';
import DoctorRoutes from './routes/DoctorRoutes';
import AdminRoutes from './routes/AdminRoutes';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* PUBLIC ROUTES */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Route>

          {/* PROTECTED DASHBOARD ROUTES */}
          <Route element={<RequireAuth />}>
            <Route element={<DashboardLayout />}>
              <Route path="/patient/*" element={<PatientRoutes />} />
              <Route path="/doctor/*" element={<DoctorRoutes />} />
              <Route path="/admin/*" element={<AdminRoutes />} />
            </Route>
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}