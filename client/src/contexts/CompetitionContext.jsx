import { createContext, useState, useEffect, useCallback } from 'react';
import { getCurrentSession, startSession } from '../services/sessionService';
import { useAuth } from '../hooks/useAuth';
import { STATUS_ROUTE_MAP } from '../utils/constants';
import { useNavigate, useLocation } from 'react-router-dom';

export const CompetitionContext = createContext();

export const CompetitionProvider = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchSession = useCallback(async () => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await getCurrentSession();
      setSession(data.session);
    } catch (err) {
      // 404 = no session yet, that's perfectly normal for a new participant
      if (err.response?.status !== 404) {
        console.error('Session fetch error:', err.response?.status);
      }
      // Don't show error for 404 — it just means no session started yet
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  // Automatic routing based on session status when entering lobby
  useEffect(() => {
    if (!loading && session && location.pathname === '/lobby') {
      const targetRoute = STATUS_ROUTE_MAP[session.status];
      if (targetRoute) {
        navigate(targetRoute);
      }
    }
  }, [loading, session, location.pathname, navigate]);

  const handleStart = async () => {
    try {
      setError(null);
      const data = await startSession();
      setSession(data.session);
      const targetRoute = STATUS_ROUTE_MAP[data.session.status];
      if (targetRoute) navigate(targetRoute);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to start competition';
      setError(msg);
      throw err;
    }
  };

  // Call this after any score change to refresh the header
  const refreshScore = useCallback(async () => {
    try {
      const data = await getCurrentSession();
      setSession(data.session);
    } catch (_) {}
  }, []);

  return (
    <CompetitionContext.Provider value={{ session, loading, error, fetchSession, startCompetition: handleStart, setSession, refreshScore }}>
      {children}
    </CompetitionContext.Provider>
  );
};
