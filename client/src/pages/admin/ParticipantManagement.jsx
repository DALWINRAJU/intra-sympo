import { useState, useEffect, useCallback } from 'react';
import adminService from '../../services/adminService';
import ParticipantDetailModal from '../../components/admin/ParticipantDetailModal';

const ParticipantManagement = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);

  const fetchParticipants = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      let query = `?limit=100`;
      if (searchTerm) query += `&search=${encodeURIComponent(searchTerm)}`;
      if (statusFilter) query += `&status=${encodeURIComponent(statusFilter)}`;

      const data = await adminService.getParticipants(query);
      setParticipants(data.participants || data.data?.participants || []);
    } catch (err) {
      setError('Failed to load participants.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    fetchParticipants();
  }, [fetchParticipants]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchParticipants();
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Are you sure you want to delete ${name || 'this participant'} and all their competition records?`)) {
      return;
    }
    try {
      await adminService.deleteParticipant(id);
      fetchParticipants();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete participant');
    }
  };

  const formatTime = (ms) => {
    if (!ms || ms <= 0) return '-';
    const totalSec = Math.floor(ms / 1000);
    const m = Math.floor(totalSec / 60);
    const s = totalSec % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Participant Management</h1>
          <p className="text-gray-400 text-sm mt-1">Manage participants, view attended questions & scores, or remove entries</p>
        </div>
        <button
          onClick={fetchParticipants}
          disabled={loading}
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-indigo-400 border border-gray-700 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
        >
          <span>🔄</span>
          <span>Refresh</span>
        </button>
      </div>

      <div className="card !p-4 bg-gray-900/80 border-gray-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <form onSubmit={handleSearch} className="flex gap-3 flex-1 w-full">
          <input
            type="text"
            className="input-field flex-grow"
            placeholder="Search by name, ID, or college..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="submit" className="btn-primary whitespace-nowrap">
            Search
          </button>
        </form>

        <div className="flex gap-2 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field !py-2.5 text-sm w-full md:w-48 bg-gray-950 border-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE_LEVEL_1">Active Level 1</option>
            <option value="ACTIVE_LEVEL_2">Active Level 2</option>
            <option value="ACTIVE_LEVEL_3">Active Level 3</option>
            <option value="COMPLETED">Completed</option>
            <option value="ELIMINATED">Eliminated</option>
          </select>

          {(searchTerm || statusFilter) && (
            <button 
              type="button" 
              className="bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold py-2.5 px-4 rounded-lg transition-colors whitespace-nowrap"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('');
              }}
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div className="text-white text-center py-16">Loading participants...</div>
      ) : error ? (
        <div className="text-red-400 text-center py-8">{error}</div>
      ) : (
        <div className="card overflow-hidden !p-0 border-gray-800 bg-gray-900/80 shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full text-sm">
              <thead>
                <tr className="bg-gray-950 border-b border-gray-800 text-gray-400 text-xs uppercase font-bold tracking-wider">
                  <th className="p-4 w-12 text-center">#</th>
                  <th className="p-4">Roll / ID</th>
                  <th className="p-4">Full Name</th>
                  <th className="p-4">College & Dept</th>
                  <th className="p-4 text-center">Score (L1/L2/L3)</th>
                  <th className="p-4 text-center">Total Points</th>
                  <th className="p-4 text-center">Status</th>
                  <th className="p-4 text-center">Time</th>
                  <th className="p-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-800/60">
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan="9" className="p-12 text-center text-gray-400">
                      No participants found.
                    </td>
                  </tr>
                ) : (
                  participants.map((p, idx) => (
                    <tr key={p.sessionId || p.participantId || idx} className="hover:bg-gray-800/50 transition-colors">
                      <td className="p-4 text-center text-gray-500 font-mono text-xs">
                        {p.rank || idx + 1}
                      </td>
                      <td className="p-4 text-indigo-400 font-mono font-semibold text-xs whitespace-nowrap">
                        {p.participantId}
                      </td>
                      <td className="p-4 text-white font-bold whitespace-nowrap">
                        <button
                          onClick={() => setSelectedStudent({ sessionId: p.sessionId, participantId: p.participant?._id })}
                          className="hover:text-indigo-400 transition-colors text-left"
                        >
                          {p.fullName}
                        </button>
                      </td>
                      <td className="p-4 text-gray-300">
                        <div>{p.collegeName}</div>
                        {p.department && <div className="text-xs text-gray-500">{p.department}</div>}
                      </td>
                      <td className="p-4 text-center font-mono text-xs text-gray-400 whitespace-nowrap">
                        <span className="text-indigo-400 font-semibold">{p.level1Score ?? 0}</span> / {' '}
                        <span className="text-red-400 font-semibold">{p.level2Score ?? 0}</span> / {' '}
                        <span className="text-yellow-400 font-semibold">{p.level3Score ?? 0}</span>
                      </td>
                      <td className="p-4 text-center font-mono font-black text-yellow-400 text-base whitespace-nowrap">
                        {p.totalScore ?? 0} pts
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          p.status === 'COMPLETED' ? 'bg-green-900/50 text-green-400 border border-green-700/50' :
                          p.status === 'ELIMINATED' ? 'bg-red-900/50 text-red-400 border border-red-700/50' :
                          'bg-blue-900/50 text-blue-400 border border-blue-700/50'
                        }`}>
                          {p.status || 'Registered'}
                        </span>
                      </td>
                      <td className="p-4 text-center text-xs font-mono text-gray-300 whitespace-nowrap">
                        {formatTime(p.timeTakenMs)}
                      </td>
                      <td className="p-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => setSelectedStudent({ sessionId: p.sessionId, participantId: p.participant?._id })}
                            className="px-3 py-1.5 rounded-lg bg-indigo-900/40 hover:bg-indigo-900/80 text-indigo-300 border border-indigo-700/50 text-xs font-bold transition-colors"
                          >
                            Details
                          </button>
                          <button
                            onClick={() => handleDelete(p.participant?._id || p.sessionId, p.fullName)}
                            className="p-1.5 rounded-lg bg-red-900/30 hover:bg-red-900/70 text-red-400 border border-red-800/40 text-xs font-bold transition-colors"
                            title="Delete participant"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detailed Student Modal */}
      {selectedStudent && (
        <ParticipantDetailModal
          sessionId={selectedStudent.sessionId}
          participantId={selectedStudent.participantId}
          onClose={() => setSelectedStudent(null)}
          onDelete={() => {
            setSelectedStudent(null);
            fetchParticipants();
          }}
        />
      )}
    </div>
  );
};

export default ParticipantManagement;
