import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

/**
 * Strict ProtectedRoute with role-based isolation:
 * - If user is not logged in -> redirect to /login
 * - If route is restricted by allowedRoles -> redirect user to their own dedicated portal smoothly
 */
const ProtectedRoute = ({ children, allowedRole = null }) => {
  const { user } = useAuthContext();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRole) {
    if (user.role === 'both' || user.purpose === 'both' || user.role === 'admin') {
      return children;
    }

    const isEmployer =
      user.role === 'employer' ||
      user.role === 'customer' ||
      user.purpose === 'post_jobs' ||
      user.userType === 'employer';
    const userRoleType = isEmployer ? 'employer' : 'worker';

    // If route requires employer and user is a worker -> redirect seamlessly
    if (allowedRole === 'employer' && userRoleType !== 'employer' && user.role !== 'admin') {
      if (location.pathname.includes('/applications/received')) {
        return <Navigate to="/my-applications" replace />;
      }
      return <Navigate to="/worker/dashboard" replace />;
    }

    // If route requires worker and user is an employer -> redirect seamlessly
    if (allowedRole === 'worker' && userRoleType !== 'worker' && user.role !== 'admin') {
      if (location.pathname.includes('/my-applications')) {
        return <Navigate to="/applications/received" replace />;
      }
      return <Navigate to="/employer/dashboard" replace />;
    }
  }

  return children;
};

export default ProtectedRoute;
