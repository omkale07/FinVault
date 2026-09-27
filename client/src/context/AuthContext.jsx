import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { setAccessToken, getAccessToken, clearAccessToken, registerAuthFailure } from '../lib/axios';
import { authService } from '../services/auth.service';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const loadUser = useCallback(async () => {
    try {
      const response = await authService.getProfile();
      setUser(response.data.user);
    } catch (error) {
      setUser(null);
    }
  }, []);

  const initPromise = React.useRef(null);

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      if (!initPromise.current) {
        initPromise.current = (async () => {
          try {
            const response = await authService.refresh();
            const token = response?.data?.token;
            if (token) {
              setAccessToken(token);
              // Wait for loadUser without depending on isMounted inside the singleton
              await loadUser();
            }
          } catch (error) {
            // Refresh failed, user stays null
          }
        })();
      }

      // Wait for the singleton initialization to finish
      await initPromise.current;

      // Now safely set loading to false for the currently mounted instance
      if (isMounted) {
        setLoading(false);
      }
    };

    initAuth();

    registerAuthFailure(() => {
      clearAccessToken();
      setUser(null);
      navigate('/login');
    });

    return () => {
      isMounted = false;
    };
  }, [navigate, loadUser]);

  const login = async (email, password) => {
    const response = await authService.login({
      email,
      password
    });

    const token = response?.data?.token;

    if (!token) {
      throw new Error('Login response did not contain an access token');
    }

    setAccessToken(token);
    await loadUser();

    return response;
  };

  const register = async (name, email, password) => {
    return await authService.register({
      name,
      email,
      password
    });
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      clearAccessToken();
      setUser(null);
      navigate('/login');
    }
  };

  const refreshUser = async () => {
    await loadUser();
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    logout,
    refreshUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
