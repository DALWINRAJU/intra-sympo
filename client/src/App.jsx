import { Routes, Route, Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { CompetitionProvider } from './contexts/CompetitionContext';
import PublicLayout from './layouts/PublicLayout';
import CompetitionLayout from './layouts/CompetitionLayout';
import AdminLayout from './layouts/AdminLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

import LandingPage from './pages/public/LandingPage';
import LeaderboardPage from './pages/public/LeaderboardPage';
import LobbyPage from './pages/competition/LobbyPage';
import Level1Page from './pages/competition/Level1Page';
import Level2Page from './pages/competition/Level2Page';
import Level3Page from './pages/competition/Level3Page';
import FinalResultPage from './pages/competition/FinalResultPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import ParticipantManagement from './pages/admin/ParticipantManagement';
import QuestionManagement from './pages/admin/QuestionManagement';
import CompetitionSettings from './pages/admin/CompetitionSettings';

function App() {
  return (
    <AuthProvider>
      <Routes>
        {/* Public Routes */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<LandingPage />} />
          <Route path="/leaderboard" element={<LeaderboardPage />} />
          <Route path="/admin/login" element={<AdminLoginPage />} />
        </Route>

        {/* Protected Participant Routes */}
        <Route element={<ProtectedRoute requireAdmin={false} />}>
          <Route element={<CompetitionProvider><Outlet /></CompetitionProvider>}>
            <Route element={<CompetitionLayout />}>
              <Route path="/lobby" element={<LobbyPage />} />
              <Route path="/level/1" element={<Level1Page />} />
              <Route path="/level/2" element={<Level2Page />} />
              <Route path="/level/3" element={<Level3Page />} />
              <Route path="/result" element={<FinalResultPage />} />
            </Route>
          </Route>
        </Route>

        {/* Protected Admin Routes */}
        <Route element={<ProtectedRoute requireAdmin={true} />}>
          <Route element={<AdminLayout />}>
            <Route path="/admin/dashboard" element={<DashboardPage />} />
            <Route path="/admin/participants" element={<ParticipantManagement />} />
            <Route path="/admin/questions" element={<QuestionManagement />} />
            <Route path="/admin/settings" element={<CompetitionSettings />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}

export default App;
