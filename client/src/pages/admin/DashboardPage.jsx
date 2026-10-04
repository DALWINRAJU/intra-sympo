import { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import ParticipantDetailModal from '../../components/admin/ParticipantDetailModal';

const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      let query = `?sortBy=totalScore&order=desc&limit=100`;
      if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;
      if (statusFilter) query += `&status=${encodeURIComponent(statusFilter)}`;

      const [statsRes, participantsRes] = await Promise.all([
        adminService.getStats(),
        adminService.getParticipants(query)
      ]);

      setStats(statsRes.data || statsRes);
      setParticipants(participantsRes.data?.participants || participantsRes.participants || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch dashboard data.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleDeleteParticipant = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete participant ${name || ''} and all associated scores?`)) {
      return;
    }
    try {
      await adminService.deleteParticipant(id);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete participant');
    }
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/40 font-black text-sm shadow-sm">🥇 1</span>;
    if (rank === 2) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-gray-400/20 text-gray-300 border border-gray-400/40 font-black text-sm shadow-sm">🥈 2</span>;
    if (rank === 3) return <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-amber-700/20 text-amber-500 border border-amber-700/40 font-black text-sm shadow-sm">🥉 3</span>;
    return <span className="font-bold text-gray-400 text-sm pl-2">#{rank}</span>;
  };

  const formatTime = (ms) => {
    if (!ms || ms <= 0) return '-';
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Admin Dashboard & Live Rankings</h1>
          <p className="text-gray-400 text-sm mt-1">Live order-wise student scores, detailed progress, and rankings</p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-indigo-400 border border-gray-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          <span>{loading ? 'Refreshing...' : 'Refresh Live Data'}</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="card !p-4 bg-gray-900/80 border-gray-800">
            <div className="text-gray-400 text-xs font-semibold uppercase">Total Students</div>
            <div className="text-3xl font-black text-white mt-1">{stats.totalParticipants || 0}</div>
          </div>
          <div className="card !p-4 bg-gray-900/80 border-gray-800">
            <div className="text-gray-400 text-xs font-semibold uppercase">Active Quiz</div>
            <div className="text-3xl font-black text-blue-400 mt-1">{stats.activeSessions || 0}</div>
          </div>
          <div className="card !p-4 bg-gray-900/80 border-gray-800">
            <div className="text-gray-400 text-xs font-semibold uppercase">Completed</div>
            <div className="text-3xl font-black text-green-400 mt-1">{stats.completedSessions || 0}</div>
          </div>
          <div className="card !p-4 bg-gray-900/80 border-gray-800">
            <div className="text-gray-400 text-xs font-semibold uppercase">Eliminated</div>
            <div className="text-3xl font-black text-red-400 mt-1">{stats.eliminatedSessions || 0}</div>
          </div>
          <div className="card !p-4 bg-gray-900/80 border-gray-800">
            <div className="text-gray-400 text-xs font-semibold uppercase">Top Score</div>
            <div className="text-3xl font-black text-yellow-400 mt-1">{stats.highestScore || 0}</div>
          </div>
          <div className="card !p-4 bg-gray-900/80 border-gray-800">
            <div className="text-gray-400 text-xs font-semibold uppercase">Avg Score</div>
            <div className="text-3xl font-black text-purple-400 mt-1">{stats.avgScore || 0}</div>
          </div>
        </div>
      )}

      {/* Filters & Search Bar */}
      <div className="card bg-gray-900/80 border-gray-800 !p-4 flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative flex-1 w-full">
          <input
            type="text"
            className="input-field w-full pl-10"
            placeholder="Search student by Name, Roll No, or College..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3.5 top-3 text-gray-500">🔍</span>
        </div>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field !py-2.5 text-sm w-full md:w-48 bg-gray-950 border-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE_LEVEL_1">Active (Level 1)</option>
            <option value="ACTIVE_LEVEL_2">Active (Level 2)</option>
            <option value="ACTIVE_LEVEL_3">Active (Level 3)</option>
            <option value="COMPLETED">Completed</option>
            <option value="ELIMINATED">Eliminated</option>
          </select>

          {(searchTerm || statusFilter) && (
            <button
              onClick={() => { setSearchTerm(''); setStatusFilter(''); }}
              className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-lg whitespace-nowrap"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Live Order-Wise Leaderboard Table */}
      <div className="card !p-0 border-gray-800 bg-gray-900/80 overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-gray-800 flex justify-between items-center bg-gray-950/40">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>🏆 Student Leaderboard & Details</span>
            <span className="text-xs bg-indigo-900/50 text-indigo-300 border border-indigo-700/50 px-2.5 py-0.5 rounded-full font-semibold">
              {participants.length} Ranked
            </span>
          </h2>
          <span className="text-xs text-gray-400">Click student name to view questions & answers</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">Loading ranked student records...</div>
        ) : error ? (
          <div className="p-6 text-red-400 text-center">{error}</div>
        ) : participants.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            No student participants found matching the criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="bg-gray-950 text-gray-400 text-xs uppercase font-bold tracking-wider border-b border-gray-800">
                  <th className="p-4 text-center w-16">Rank</th>
                  <th className="p-4">Student Name & Roll No</th>
                  <th className="p-4">College</th>
                  <th className="p-4 text-center">L1</th>
                  <th className="p-4 text-center">L2</th>
                  <th className="p-4 text-center">L3</th>
                  <th className="p-4 text-center">Total Points</th>
                  <th className="p-4 text-center">Time Taken</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60 text-sm">
                {participants.map((p) => {
                  const isTop3 = p.rank <= 3;
                  return (
                    <tr 
                      key={p.sessionId || p.participantId} 
                      className={`hover:bg-gray-800/50 transition-colors ${
                        isTop3 ? 'bg-indigo-950/10' : ''
                      }`}
                    >
                      <td className="p-4 text-center whitespace-nowrap">
                        {getRankBadge(p.rank)}
                      </td>
                      <td className="p-4">
                        <button
                          onClick={() => setSelectedStudent({ sessionId: p.sessionId, participantId: p.participant?._id })}
                          className="text-left group flex flex-col"
                        >
                          <span className="font-bold text-white group-hover:text-indigo-400 transition-colors">
                            {p.fullName}
                          </span>
                          <span className="text-xs font-mono text-gray-400">
                            {p.participantId}
                          </span>
                        </button>
                      </td>
                      <td className="p-4 text-gray-300">
                        <div>{p.collegeName}</div>
                        {p.department && <div className="text-xs text-gray-500">{p.department}</div>}
                      </td>
                      <td className="p-4 text-center font-mono font-semibold text-indigo-400">
                        {p.level1Score}
                      </td>
                      <td className="p-4 text-center font-mono font-semibold text-red-400">
                        {p.level2Score}
                      </td>
                      <td className="p-4 text-center font-mono font-semibold text-yellow-400">
                        {p.level3Score}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className="text-base font-black text-yellow-400 font-mono bg-yellow-950/40 border border-yellow-700/40 px-3 py-1 rounded-lg">
                          {p.totalScore} pts
                        </span>
                      </td>
                      <td className="p-4 text-center font-mono text-gray-300 text-xs whitespace-nowrap">
                        {formatTime(p.timeTakenMs)}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                          p.status === 'COMPLETED' ? 'bg-green-900/50 text-green-400 border border-green-700/50' :
                          p.status === 'ELIMINATED' ? 'bg-red-900/50 text-red-400 border border-red-700/50' :
                          'bg-blue-900/50 text-blue-400 border border-blue-700/50'
                        }`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedStudent({ sessionId: p.sessionId, participantId: p.participant?._id })}
                            className="px-3 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 text-xs font-bold transition-colors"
                            title="View question-by-question breakdown"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleDeleteParticipant(p.participant?._id || p.sessionId, p.fullName)}
                            className="p-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/70 text-red-400 border border-red-800/40 text-xs font-bold transition-colors"
                            title="Delete student record"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detailed Student Modal */}
      {selectedStudent && (
        <ParticipantDetailModal
          sessionId={selectedStudent.sessionId}
          participantId={selectedStudent.participantId}
          onClose={() => setSelectedStudent(null)}
          onDelete={() => {
            setSelectedStudent(null);
            fetchData();
          }}
        />
      )}
    </div>
  );
};

export default DashboardPage;
