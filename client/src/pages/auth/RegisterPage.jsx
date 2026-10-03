import React from 'react';
import LoginPage from './LoginPage';

const RegisterPage = () => {
  // Renders the unified Auth page defaulting directly to the "Create Account" tab
  return <LoginPage initialTab="register" />;
};

export default RegisterPage;
