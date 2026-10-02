import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminService.getStats();
        setStats(data.data);
      } catch (err) {
        setError('Failed to fetch dashboard statistics.');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) return <div className="text-white">Loading dashboard...</div>;
  if (error) return <div className="text-red-400">{error}</div>;
  if (!stats) return null;

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-white mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="card">
          <div className="text-gray-400 text-sm mb-1">Total Participants</div>
          <div className="text-4xl font-bold text-white">{stats.totalParticipants}</div>
        </div>
        <div className="card">
          <div className="text-gray-400 text-sm mb-1">Active Sessions</div>
          <div className="text-4xl font-bold text-blue-400">{stats.activeSessions}</div>
        </div>
        <div className="card">
          <div className="text-gray-400 text-sm mb-1">Completed</div>
          <div className="text-4xl font-bold text-green-400">{stats.completedSessions}</div>
        </div>
        <div className="card">
          <div className="text-gray-400 text-sm mb-1">Eliminated</div>
          <div className="text-4xl font-bold text-red-400">{stats.eliminatedSessions}</div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
