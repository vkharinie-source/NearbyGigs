import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';

// Pages
import LandingPage from '../pages/landing/LandingPage';
import Onboarding from '../pages/onboarding/Onboarding';
import ChoosePurposePage from '../pages/onboarding/ChoosePurposePage';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import WorkerDashboardPage from '../pages/dashboard/WorkerDashboardPage';
import EmployerDashboardPage from '../pages/dashboard/EmployerDashboardPage';
import FindGigsPage from '../pages/gigs/FindGigsPage';
import CreateGigPage from '../pages/gigs/CreateGigPage';
import MyGigsPage from '../pages/gigs/MyGigsPage';
import FindWorkersPage from '../pages/workers/FindWorkersPage';
import CreateServicePage from '../pages/services/CreateServicePage';
import MyApplicationsPage from '../pages/applications/MyApplicationsPage';
import ReceivedApplicationsPage from '../pages/applications/ReceivedApplicationsPage';
import ServiceRequestsPage from '../pages/requests/ServiceRequestsPage';
import MessagesPage from '../pages/messages/MessagesPage';
import NotificationsPage from '../pages/notifications/NotificationsPage';
import ProfilePage from '../pages/profile/ProfilePage';
import SettingsPage from '../pages/settings/SettingsPage';
import SafetyCenterPage from '../pages/safety/SafetyCenterPage';
import MyComplaintsPage from '../pages/complaints/MyComplaintsPage';
import ManagerComplaintsPage from '../pages/complaints/ManagerComplaintsPage';
import AdminDisputesPage from '../pages/admin/AdminDisputesPage';

// Protected Route Guard
import ProtectedRoute from './ProtectedRoute';

const DashboardDispatcher = () => {
  const { user } = useAuthContext();
  const isEmployer =
    user?.role === 'employer' || user?.role === 'customer' || user?.purpose === 'post_jobs';
  return <Navigate to={isEmployer ? '/employer/dashboard' : '/worker/dashboard'} replace />;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Pages */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/find-gigs" element={<FindGigsPage />} />
      <Route path="/gigs" element={<FindGigsPage />} />
      <Route path="/gigs/:id" element={<FindGigsPage />} />
      <Route path="/find-workers" element={<FindWorkersPage />} />
      <Route path="/workers" element={<FindWorkersPage />} />
      <Route path="/workers/:id" element={<FindWorkersPage />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route
        path="/choose-purpose"
        element={
          <ProtectedRoute>
            <ChoosePurposePage />
          </ProtectedRoute>
        }
      />

      {/* Protected Dashboard Pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardDispatcher />
          </ProtectedRoute>
        }
      />
      <Route
        path="/employer/dashboard"
        element={
          <ProtectedRoute allowedRole="employer">
            <EmployerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/employer"
        element={
          <ProtectedRoute allowedRole="employer">
            <EmployerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/worker/dashboard"
        element={
          <ProtectedRoute allowedRole="worker">
            <WorkerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/worker"
        element={
          <ProtectedRoute allowedRole="worker">
            <WorkerDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-gig"
        element={
          <ProtectedRoute allowedRole="employer">
            <CreateGigPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-gigs"
        element={
          <ProtectedRoute allowedRole="employer">
            <MyGigsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-service"
        element={
          <ProtectedRoute>
            <CreateServicePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-services"
        element={
          <ProtectedRoute>
            <CreateServicePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-applications"
        element={
          <ProtectedRoute allowedRole="worker">
            <MyApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications/received"
        element={
          <ProtectedRoute allowedRole="employer">
            <ReceivedApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/requests"
        element={
          <ProtectedRoute>
            <ServiceRequestsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <MessagesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notifications"
        element={
          <ProtectedRoute>
            <NotificationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <SettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/safety"
        element={
          <ProtectedRoute>
            <SafetyCenterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/safety"
        element={
          <ProtectedRoute>
            <SafetyCenterPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-complaints"
        element={
          <ProtectedRoute>
            <MyComplaintsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/manager/complaints"
        element={
          <ProtectedRoute>
            <ManagerComplaintsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/complaints"
        element={
          <ProtectedRoute>
            <ManagerComplaintsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/disputes"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDisputesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/dispute-resolution"
        element={
          <ProtectedRoute allowedRole="admin">
            <AdminDisputesPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

export default AppRoutes;
