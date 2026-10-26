import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthContext } from '../../context/AuthContext';
import WorkerDashboardPage from './WorkerDashboardPage';
import EmployerDashboardPage from './EmployerDashboardPage';

/**
 * Unified Dashboard entry point:
 * Dynamically routes to WorkerDashboardPage or EmployerDashboardPage
 * based on role, purpose, and URL query params.
 */
const DashboardPage = ({ initialMode = null }) => {
  const { user } = useAuthContext();
  const [searchParams] = useSearchParams();

  const modeParam = searchParams.get('mode');

  // Determine active dashboard mode
  const isEmployer =
    initialMode === 'employer' ||
    modeParam === 'employer' ||
    (!modeParam &&
      !initialMode &&
      (user?.role === 'employer' || user?.role === 'customer' || user?.purpose === 'post_jobs'));

  if (isEmployer) {
    return <EmployerDashboardPage />;
  }

  return <WorkerDashboardPage />;
};

export default DashboardPage;
