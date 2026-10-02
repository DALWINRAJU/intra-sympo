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
    if (!isAuthenticated) return;
    try {
      setLoading(true);
      const data = await getCurrentSession();
      setSession(data.session);
    } catch (err) {
      if (err.response?.status !== 404) {
        setError('Failed to load session');
      }
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
      setError(err.response?.data?.message || 'Failed to start competition');
      throw err;
    }
  };

  return (
    <CompetitionContext.Provider value={{ session, loading, error, fetchSession, startCompetition: handleStart, setSession }}>
      {children}
    </CompetitionContext.Provider>
  );
};
