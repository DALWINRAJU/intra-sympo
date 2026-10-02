import { useCompetition } from '../../hooks/useCompetition';
import { useNavigate } from 'react-router-dom';

const LobbyPage = () => {
  const { startCompetition, loading, error, session } = useCompetition();
  const navigate = useNavigate();

  if (loading) {
    return <div className="text-center text-white">Loading lobby...</div>;
  }

  const onStart = async () => {
    try {
      await startCompetition();
    } catch (e) {
      // Error handled natively in context
    }
  };

  return (
    <div className="card max-w-2xl mx-auto w-full">
      <h1 className="text-3xl font-bold text-white mb-6 text-center">Symposium Technical Quiz</h1>
      
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

      <div className="mt-8">
        {session ? (
          <button onClick={() => navigate('/level/1')} className="btn-primary w-full text-lg py-4">
            Resume Competition
          </button>
        ) : (
          <button onClick={onStart} className="btn-primary w-full text-lg py-4 bg-green-600 hover:bg-green-500">
            START GAME
          </button>
        )}
      </div>
    </div>
  );
};
export default LobbyPage;
