import React from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RequireDoctorApproved = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-700 font-semibold">
        Checking doctor approval status...
      </div>
    );
  }

  if (!user || user.role !== 'Doctor') {
    return <Navigate to="/unauthorized" replace state={{ from: location }} />;
  }

  if (user.doctorStatus !== 'Approved') {
    return <Navigate to="/doctor/request" replace state={{ from: location }} />;
  }

  return <Outlet />;
};

export default RequireDoctorApproved;