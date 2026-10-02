import { useState, useEffect } from 'react';
import resultService from '../../services/resultService';
import { Link } from 'react-router-dom';

const LeaderboardPage = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const data = await resultService.getLeaderboard();
        setLeaderboard(data.leaderboard);
      } catch (err) {
        setError('Failed to fetch leaderboard data.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLeaderboard();
    // Poll every 30 seconds
    const interval = setInterval(fetchLeaderboard, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTime = (ms) => {
    if (!ms) return '-';
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}m ${secs}s`;
  };

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Live Leaderboard</h1>
        <Link to="/" className="text-indigo-400 hover:text-indigo-300 font-semibold">
          Back to Home
        </Link>
      </div>

      {loading && leaderboard.length === 0 ? (
        <div className="text-center text-white py-12">Loading leaderboard...</div>
      ) : error ? (
        <div className="text-red-400 text-center py-12">{error}</div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-900 border-b border-gray-700">
                <th className="p-4 text-gray-400 font-semibold">Rank</th>
                <th className="p-4 text-gray-400 font-semibold">Name</th>
                <th className="p-4 text-gray-400 font-semibold">College</th>
                <th className="p-4 text-gray-400 font-semibold">Score</th>
                <th className="p-4 text-gray-400 font-semibold">Time</th>
                <th className="p-4 text-gray-400 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-gray-400">
                    No results available yet.
                  </td>
                </tr>
              ) : (
                leaderboard.map((entry, index) => (
                  <tr 
                    key={entry._id} 
                    className={`border-b border-gray-800 hover:bg-gray-800/50 transition-colors ${
                      index < 3 ? 'bg-indigo-900/10' : ''
                    }`}
                  >
                    <td className="p-4">
                      <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                        index === 0 ? 'bg-yellow-500 text-yellow-950' :
                        index === 1 ? 'bg-gray-300 text-gray-800' :
                        index === 2 ? 'bg-amber-700 text-amber-100' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {index + 1}
                      </div>
                    </td>
                    <td className="p-4 text-white font-medium">{entry.participant?.fullName || 'Unknown'}</td>
                    <td className="p-4 text-gray-400 text-sm">{entry.participant?.collegeName || '-'}</td>
                    <td className="p-4 text-indigo-400 font-bold">{entry.totalScore}</td>
                    <td className="p-4 text-gray-300 font-mono text-sm">{formatTime(entry.timeTakenMs)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        entry.status === 'COMPLETED' ? 'bg-green-900/50 text-green-400' :
                        entry.status === 'ELIMINATED' ? 'bg-red-900/50 text-red-400' :
                        'bg-blue-900/50 text-blue-400'
                      }`}>
                        {entry.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default LeaderboardPage;
