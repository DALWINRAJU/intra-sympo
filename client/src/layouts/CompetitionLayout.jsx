import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useCompetition } from '../hooks/useCompetition';
import AntiCheatWrapper from '../components/common/AntiCheatWrapper';
import CompetitionTimer from '../components/common/CompetitionTimer';

const CompetitionLayout = () => {
  const { user } = useAuth();
  const { session } = useCompetition();

  const isLevel2 = session?.status?.includes('LEVEL_2');
  const isGameOver = session?.status === 'COMPLETED' || session?.status === 'ELIMINATED';

  return (
    <AntiCheatWrapper>
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
        <header className="border-b border-gray-800 bg-gray-900 px-6 py-3 flex justify-between items-center">
          <div className="font-bold text-indigo-400 text-lg">Technical Quiz</div>
          <div className="flex items-center gap-4">
            {/* Live timer — stops when game is over */}
            {session?.startTime && (
              <CompetitionTimer startTime={session.startTime} stopped={isGameOver} />
            )}
            {/* Live score */}
            {session && (
              <div className="flex items-center gap-3">
                <span className="text-xs text-gray-500 uppercase tracking-wider">Score</span>
                <span className="font-bold text-yellow-400 text-lg">{session.totalScore ?? 0}</span>
                {/* Show lives only on Level 2 */}
                {isLevel2 && (
                  <div className="flex items-center gap-1 ml-2">
                    <span className="text-xs text-gray-500 uppercase tracking-wider mr-1">Lives</span>
                    {[1, 2, 3].map(h => (
                      <span key={h} className={h <= session.lives ? 'text-red-500 text-base' : 'text-gray-700 opacity-30 grayscale text-base'}>❤️</span>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="text-gray-400 text-sm border-l border-gray-700 pl-4">
              {user?.fullName || user?.participantId}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
          <Outlet />
        </main>
      </div>
    </AntiCheatWrapper>
  );
};
export default CompetitionLayout;
