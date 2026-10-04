import { useCompetition } from '../../hooks/useCompetition';
import { useAuth } from '../../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { STATUS_ROUTE_MAP } from '../../utils/constants';

const LobbyPage = () => {
  const { startCompetition, loading, error, session } = useCompetition();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return <div className="text-center text-white">Loading lobby...</div>;
  }

  const onStart = async () => {
    try {
      await startCompetition();
    } catch (e) {
      // Error handled in context
    }
  };

  // If the session is completed or eliminated, go to results
  if (session && (session.status === 'COMPLETED' || session.status === 'ELIMINATED')) {
    return (
      <div className="card max-w-2xl mx-auto w-full text-center">
        <h1 className="text-3xl font-bold text-white mb-4">Competition Finished</h1>
        <p className="text-gray-400 mb-6">You have already completed this competition.</p>
        <div className="space-y-3">
          <button onClick={() => navigate('/result')} className="btn-primary w-full text-lg py-4">
            View Your Results
          </button>
          <button onClick={logout} className="w-full text-lg py-4 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="card max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-white mb-2 text-center">Symposium Technical Quiz</h1>
      {user && (
        <p className="text-center text-gray-400 mb-6 text-sm">
          Welcome, <span className="text-indigo-400 font-semibold">{user.fullName || user.participantId}</span>
        </p>
      )}
      
      <div className="space-y-6 text-gray-300">
        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-bold text-indigo-400 mb-2">Level 1: Core Fundamentals (MCQ)</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Multiple choice questions testing OS, DS, Java, Python, and OOSE.</li>
            <li>No negative marking.</li>
          </ul>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-bold text-indigo-400 mb-2">Level 2: Exit Room Challenge</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>You must successfully pass through consecutive steps.</li>
            <li>You start with 3 lives (❤️ ❤️ ❤️).</li>
            <li>Incorrect answers cost 1 life. Lose all 3, and you are immediately eliminated!</li>
          </ul>
        </div>

        <div className="bg-gray-800/50 p-4 rounded-lg border border-gray-700">
          <h3 className="text-lg font-bold text-indigo-400 mb-2">Level 3: Code Output Guessing</h3>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Analyze complex Python and Java code snippets.</li>
            <li>Type the EXACT output the code will produce.</li>
          </ul>
        </div>
      </div>

      {error && (
        <div className="mt-6 rounded-lg bg-red-900/50 p-4 border border-red-800 text-sm text-red-200 text-center">
          {error}
        </div>
      )}

      <div className="mt-8 space-y-3">
        {session ? (
          <button onClick={async () => {
            // Get correct resume page from session status
            const resumeRoute = STATUS_ROUTE_MAP[session.status] || '/level/1';
            try {
              if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
              }
            } catch (err) { console.error(err); }
            navigate(resumeRoute);
          }} className="btn-primary w-full text-lg py-4">
            Resume Competition (Level {session?.status?.includes('LEVEL_2') ? 2 : session?.status?.includes('LEVEL_3') ? 3 : (session?.currentLevel || 1)})
          </button>
        ) : (
          <button onClick={async () => {
            try {
              if (document.documentElement.requestFullscreen) {
                await document.documentElement.requestFullscreen();
              }
            } catch (err) { console.error(err); }
            onStart();
          }} className="btn-primary w-full text-lg py-4 bg-green-600 hover:bg-green-500">
            START GAME
          </button>
        )}
        <button onClick={logout} className="w-full text-lg py-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-bold transition-colors">
          Logout
        </button>
      </div>
    </div>
  );
};
export default LobbyPage;
