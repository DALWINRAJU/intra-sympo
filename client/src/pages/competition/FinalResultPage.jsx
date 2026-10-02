import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import resultService from '../../services/resultService';
import { useAuth } from '../../hooks/useAuth';

const FinalResultPage = () => {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchResult = async () => {
      try {
        const data = await resultService.getMyResult();
        setResult(data.result);
      } catch (err) {
        setError('Failed to fetch results.');
      } finally {
        setLoading(false);
      }
    };
    fetchResult();
  }, []);

  if (loading) return <div className="text-center text-white py-12 text-lg">Loading your result...</div>;
  if (error) return <div className="text-red-400 text-center py-12 text-lg">{error}</div>;
  if (!result) return null;

  return (
    <div className="max-w-2xl mx-auto w-full text-center">
      <h1 className="text-4xl font-bold text-white mb-8">Competition Completed</h1>
      
      <div className="card mb-8">
        <h2 className="text-2xl font-bold mb-4 text-indigo-400">Final Score</h2>
        <div className="text-6xl font-bold text-white mb-6">{result.totalScore}</div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Level 1</div>
            <div className="text-xl font-bold">{result.level1Score}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Level 2</div>
            <div className="text-xl font-bold">{result.level2Score}</div>
          </div>
          <div className="bg-gray-800 p-4 rounded-lg">
            <div className="text-gray-400 text-sm mb-1">Level 3</div>
            <div className="text-xl font-bold">{result.level3Score}</div>
          </div>
        </div>

        <div className="bg-gray-800 p-4 rounded-lg mb-6 flex justify-around">
          <div>
            <div className="text-gray-400 text-sm mb-1">Status</div>
            <div className={`text-lg font-bold ${result.status === 'ELIMINATED' ? 'text-red-400' : 'text-green-400'}`}>
              {result.status}
            </div>
          </div>
          <div>
            <div className="text-gray-400 text-sm mb-1">Time Taken</div>
            <div className="text-lg font-bold">
              {Math.floor(result.timeTakenMs / 60000)}m {Math.floor((result.timeTakenMs % 60000) / 1000)}s
            </div>
          </div>
        </div>
      </div>
      
      <button 
        onClick={logout}
        className="btn-primary"
      >
        Log Out
      </button>
    </div>
  );
};

export default FinalResultPage;
