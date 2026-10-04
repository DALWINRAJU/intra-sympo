import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import resultService from '../../services/resultService';
import { useAuth } from '../../hooks/useAuth';

const FinalResultPage = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await resultService.getMyResult();
        setResult(data.result);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch results.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, []);

  if (loading) return <div className="text-center text-white py-12 text-lg">Loading your result...</div>;
  if (error) return <div className="text-red-400 text-center py-12 text-lg">{error}</div>;
  if (!result) return null;

  const isEliminated = result.status === 'ELIMINATED';
  const name = result.fullName || user?.fullName || user?.participantId || 'Participant';
  const timeSec = Math.floor((result.timeTakenMs || 0) / 1000);
  const minutes = Math.floor(timeSec / 60);
  const seconds = timeSec % 60;

  return (
    <div className="max-w-2xl mx-auto w-full text-center py-4">
      <div className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold mb-4 ${isEliminated ? 'bg-red-900/50 text-red-400 border border-red-700' : 'bg-green-900/50 text-green-400 border border-green-700'}`}>
        {isEliminated ? '⚠️ Game Ended (Eliminated)' : '🎉 Competition Completed'}
      </div>

      <h1 className="text-3xl font-extrabold text-white mb-2">
        {name}
      </h1>
      {(result.collegeName || result.participantId) && (
        <p className="text-gray-400 text-sm mb-6">
          {result.participantId && <span className="font-mono text-indigo-400 mr-2">[{result.participantId}]</span>}
          {result.collegeName} {result.department ? `• ${result.department}` : ''}
        </p>
      )}

      <div className="card mb-6 border-gray-800 bg-gray-900/80 backdrop-blur shadow-2xl p-6">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-400 mb-2">Total Points</h2>
        <div className="text-6xl font-black text-yellow-400 mb-6">{result.totalScore}</div>

        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-gray-800/80 border border-gray-700/60 p-3.5 rounded-xl">
            <div className="text-gray-400 text-xs font-medium uppercase mb-1">Level 1</div>
            <div className="text-xl font-bold text-indigo-400">{result.level1Score} pts</div>
          </div>
          <div className="bg-gray-800/80 border border-gray-700/60 p-3.5 rounded-xl">
            <div className="text-gray-400 text-xs font-medium uppercase mb-1">Level 2</div>
            <div className="text-xl font-bold text-red-400">{result.level2Score} pts</div>
          </div>
          <div className="bg-gray-800/80 border border-gray-700/60 p-3.5 rounded-xl">
            <div className="text-gray-400 text-xs font-medium uppercase mb-1">Level 3</div>
            <div className="text-xl font-bold text-yellow-400">{result.level3Score} pts</div>
          </div>
        </div>

        <div className="bg-gray-800/50 border border-gray-700/40 p-4 rounded-xl flex justify-around items-center">
          <div>
            <div className="text-gray-400 text-xs font-medium uppercase mb-1">Status</div>
            <div className={`text-base font-bold ${isEliminated ? 'text-red-400' : 'text-green-400'}`}>
              {isEliminated ? 'Eliminated' : 'Completed'}
            </div>
          </div>
          <div className="h-8 w-px bg-gray-700/50"></div>
          <div>
            <div className="text-gray-400 text-xs font-medium uppercase mb-1">Time Taken</div>
            <div className="text-base font-bold text-gray-200">
              {minutes}m {seconds}s
            </div>
          </div>
          {result.rank && (
            <>
              <div className="h-8 w-px bg-gray-700/50"></div>
              <div>
                <div className="text-gray-400 text-xs font-medium uppercase mb-1">Rank</div>
                <div className="text-base font-bold text-indigo-400">
                  #{result.rank}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      <button 
        onClick={logout}
        className="btn-primary w-full py-4 text-lg font-bold bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/30"
      >
        Log Out
      </button>
    </div>
  );
};

export default FinalResultPage;
