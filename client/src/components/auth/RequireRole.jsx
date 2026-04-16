import React from 'react';
import { Navigate, Outlet, UNSAFE_getTurboStreamSingleFetchDataStrategy } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const RequireRole = ({ allowedRoles }) => {
  const { hasRole } = useAuth();

  if (!hasRole(allowedRoles)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
};

export default RequireRole;
