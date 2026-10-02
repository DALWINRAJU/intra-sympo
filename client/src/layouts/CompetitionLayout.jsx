import { Outlet } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const CompetitionLayout = () => {
  const { user } = useAuth();
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col">
      <header className="border-b border-gray-800 bg-gray-900 px-6 py-4 flex justify-between items-center">
        <div className="font-bold text-indigo-400">Technical Quiz</div>
        <div className="text-gray-400 text-sm">Participant: {user?.fullName}</div>
      </header>
      <main className="flex-1 p-6 max-w-4xl mx-auto w-full">
        <Outlet />
      </main>
    </div>
  );
};
export default CompetitionLayout;
