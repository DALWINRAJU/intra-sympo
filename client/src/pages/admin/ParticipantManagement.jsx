import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

const ParticipantManagement = () => {
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchParticipants();
  }, []);

  const fetchParticipants = async (query = '') => {
    try {
      setLoading(true);
      const data = await adminService.getParticipants(query);
      setParticipants(data.participants || data.data || []);
    } catch (err) {
      setError('Failed to load participants.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchParticipants(`?search=${searchTerm}`);
  };

  return (
    <div className="w-full">
      <h1 className="text-3xl font-bold text-white mb-8">Participant Management</h1>

      <div className="card mb-8">
        <form onSubmit={handleSearch} className="flex gap-4">
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
          <button 
            type="button" 
            className="bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-colors"
            onClick={() => {
              setSearchTerm('');
              fetchParticipants();
            }}
          >
            Clear
          </button>
        </form>
      </div>

      {loading ? (
        <div className="text-white text-center py-8">Loading participants...</div>
      ) : error ? (
        <div className="text-red-400 text-center py-8">{error}</div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-700">
                  <th className="p-4 text-gray-400 font-semibold whitespace-nowrap">ID</th>
                  <th className="p-4 text-gray-400 font-semibold whitespace-nowrap">Name</th>
                  <th className="p-4 text-gray-400 font-semibold whitespace-nowrap">College</th>
                  <th className="p-4 text-gray-400 font-semibold whitespace-nowrap">Dept</th>
                  <th className="p-4 text-gray-400 font-semibold whitespace-nowrap">Registered</th>
                </tr>
              </thead>
              <tbody>
                {participants.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-400">
                      No participants found.
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => (
                    <tr key={p._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 text-indigo-400 font-mono text-sm">{p.participantId}</td>
                      <td className="p-4 text-white font-medium">{p.fullName}</td>
                      <td className="p-4 text-gray-300">{p.collegeName}</td>
                      <td className="p-4 text-gray-300">{p.department}</td>
                      <td className="p-4 text-gray-400 text-sm">
                        {new Date(p.registeredAt || p.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParticipantManagement;
