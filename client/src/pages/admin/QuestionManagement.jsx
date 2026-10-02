import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

const QuestionManagement = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterLevel, setFilterLevel] = useState('');

  useEffect(() => {
    fetchQuestions();
  }, [filterLevel]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const query = filterLevel ? `?level=${filterLevel}` : '';
      const data = await adminService.getQuestions(query);
      setQuestions(data.questions || data.data || []);
    } catch (err) {
      setError('Failed to load questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await adminService.toggleQuestion(id);
      fetchQuestions(); // Refresh list
    } catch (err) {
      alert('Failed to toggle question status');
    }
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-white">Question Management</h1>
        <select 
          className="input-field max-w-xs" 
          value={filterLevel} 
          onChange={(e) => setFilterLevel(e.target.value)}
        >
          <option value="">All Levels</option>
          <option value="1">Level 1 (MCQ)</option>
          <option value="2">Level 2 (Exit Room)</option>
          <option value="3">Level 3 (Guess Output)</option>
        </select>
      </div>

      {loading ? (
        <div className="text-white text-center py-8">Loading questions...</div>
      ) : error ? (
        <div className="text-red-400 text-center py-8">{error}</div>
      ) : (
        <div className="card overflow-hidden !p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-full">
              <thead>
                <tr className="bg-gray-900 border-b border-gray-700">
                  <th className="p-4 text-gray-400 font-semibold">Lvl</th>
                  <th className="p-4 text-gray-400 font-semibold">Type</th>
                  <th className="p-4 text-gray-400 font-semibold">Category</th>
                  <th className="p-4 text-gray-400 font-semibold">Question Preview</th>
                  <th className="p-4 text-gray-400 font-semibold">Points</th>
                  <th className="p-4 text-gray-400 font-semibold">Status</th>
                  <th className="p-4 text-gray-400 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {questions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="p-8 text-center text-gray-400">
                      No questions found.
                    </td>
                  </tr>
                ) : (
                  questions.map((q) => (
                    <tr key={q._id} className="border-b border-gray-800 hover:bg-gray-800/50">
                      <td className="p-4 text-white font-bold">{q.level}</td>
                      <td className="p-4 text-gray-300 text-sm">
                        <span className="bg-gray-700 px-2 py-1 rounded">{q.type}</span>
                      </td>
                      <td className="p-4 text-indigo-300 text-sm">{q.category}</td>
                      <td className="p-4 text-gray-300 max-w-xs truncate" title={q.questionText}>
                        {q.questionText}
                      </td>
                      <td className="p-4 text-green-400">{q.points}</td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${q.isActive ? 'bg-green-900/50 text-green-400' : 'bg-red-900/50 text-red-400'}`}>
                          {q.isActive ? 'ACTIVE' : 'DISABLED'}
                        </span>
                      </td>
                      <td className="p-4">
                        <button 
                          onClick={() => handleToggle(q._id)}
                          className={`text-sm px-3 py-1 rounded font-semibold ${q.isActive ? 'bg-red-600 hover:bg-red-500 text-white' : 'bg-green-600 hover:bg-green-500 text-white'}`}
                        >
                          {q.isActive ? 'Disable' : 'Enable'}
                        </button>
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

export default QuestionManagement;
