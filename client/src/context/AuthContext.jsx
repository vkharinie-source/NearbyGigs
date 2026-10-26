import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    return saved && token ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);

  // Validate session on mount
  useEffect(() => {
    const validateAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const freshUser = await authService.getCurrentUser();
          if (freshUser) {
            setUser(freshUser);
            localStorage.setItem('user', JSON.stringify(freshUser));
          }
        } catch (err) {
          if (err.response?.status === 401 || err.response?.status === 404) {
            authService.logout();
            setUser(null);
          }
        }
      } else {
        setUser(null);
      }
    };
    validateAuth();
  }, []);

  const login = async (credentials) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    setLoading(true);
    try {
      const data = await authService.register(userData);
      // User must sign in first before accessing dashboard, do not set user here
      return data;
    } finally {
      setLoading(false);
    }
  };

  const choosePurpose = async (purpose) => {
    setLoading(true);
    try {
      const data = await authService.choosePurpose(purpose);
      if (data.user) {
        setUser((prev) => ({ ...prev, ...data.user }));
      }
      return data;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const fresh = await authService.getCurrentUser();
      if (fresh) {
        setUser(fresh);
        localStorage.setItem('user', JSON.stringify(fresh));
      }
      return fresh;
    } catch (e) {
      console.warn('Refresh user error:', e);
    }
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        register,
        choosePurpose,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuthContext = () => useContext(AuthContext);
