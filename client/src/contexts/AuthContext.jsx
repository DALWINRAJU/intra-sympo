import { createContext, useState, useEffect } from 'react';
import { logout as authServiceLogout } from '../services/authService';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Do NOT restore session from localStorage — every page reload requires fresh login
    // (This enforces the anti-cheat requirement: reload = logout)
    authServiceLogout(); // Clear any stale token in case browser didn't clear it
    setLoading(false);
  }, []);

  const login = (userData) => {
    setUser(userData);
  };

  const logout = () => {
    authServiceLogout();
    setUser(null);
    window.location.href = '/';
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center bg-gray-950 text-white">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};
