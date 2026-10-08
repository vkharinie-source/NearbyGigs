import React from 'react';
import { Routes, Route } from 'react-router-dom';

// Pages
import LandingPage from '../pages/landing/LandingPage';
import Onboarding from '../pages/onboarding/Onboarding';
import LoginPage from '../pages/auth/LoginPage';
import RegisterPage from '../pages/auth/RegisterPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
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

// Protected Route Guard
import ProtectedRoute from './ProtectedRoute';

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

      {/* Protected Dashboard Pages */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/create-gig"
        element={
          <ProtectedRoute>
            <CreateGigPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/my-gigs"
        element={
          <ProtectedRoute>
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
          <ProtectedRoute>
            <MyApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/applications/received"
        element={
          <ProtectedRoute>
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
    </Routes>
  );
};

export default AppRoutes;
