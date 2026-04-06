import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

// Import Layouts
import MainLayout from './layouts/MainLayout';
import DashboardLayout from './layouts/DashboardLayout';

// Import Public Pages
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Unauthorized from './pages/Unauthorized';

// Import Auth Components & Context
import RequireAuth from './components/auth/RequireAuth';
import { AuthProvider } from './context/AuthContext';

// Import AI components
import SymptomChecker from './pages/ai/SymptomChecker';
import SymptomHistoryPage from './pages/ai/SymptomHistoryPage';

// Import Modular Role Routes
import PatientRoutes from './routes/PatientRoutes';
import DoctorRoutes from './routes/DoctorRoutes';
import AdminRoutes from './routes/AdminRoutes';

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          
          {/* --- PUBLIC ROUTES --- */}
          <Route element={<MainLayout />}>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
          </Route>

          {/* --- SECURE DASHBOARD ROUTES --- */}
          {/* RequireAuth ensures no one gets past this point without a valid JWT token */}
          <Route element={<RequireAuth />}>
            {/* DashboardLayout provides the Sidebars and Top Headers */}
            <Route element={<DashboardLayout />}>
              
              {/* The "/*" wildcard tells React Router to look inside these files for deeper paths */}
              <Route path="/patient/*" element={<PatientRoutes />} />
              <Route path="/doctor/*" element={<DoctorRoutes />} />
              <Route path="/admin/*" element={<AdminRoutes />} />
              <Route path="/symptom-checker" element={<SymptomChecker />} />
              <Route path="/symptom-history" element={<SymptomHistoryPage onNewCheck={() => navigate('/symptom-checker')} />} />
              
            </Route>
          </Route>

        </Routes>
      </Router>
    </AuthProvider>
  );
}