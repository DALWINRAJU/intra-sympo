import { useState, useEffect } from 'react';
import adminService from '../../services/adminService';

const ParticipantDetailModal = ({ participantId, sessionId, onClose, onDelete }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [filterLevel, setFilterLevel] = useState('ALL');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        setLoading(true);
        setError('');
        const res = await adminService.getParticipantDetail(sessionId || participantId);
        setData(res.data || res);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch student details');
      } finally {
        setLoading(false);
      }
    };

    if (participantId || sessionId) {
      fetchDetail();
    }
  }, [participantId, sessionId]);

  const handleDelete = async () => {
    if (!window.confirm(`Are you sure you want to completely delete ${participant?.fullName || 'this participant'} and all their session & answer data? This action cannot be undone.`)) {
      return;
    }
    try {
      setDeleting(true);
      await adminService.deleteParticipant(participant?._id || sessionId || participantId);
      if (onDelete) onDelete(participant?._id || sessionId);
      onClose();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete participant');
    } finally {
      setDeleting(false);
    }
  };

  if (!participantId && !sessionId) return null;

  const participant = data?.participant || data?.session?.participant;
  const session = data?.session;
  const answers = data?.answers || [];

  const timeSec = session?.timeTakenMs ? Math.floor(session.timeTakenMs / 1000) : 0;
  const minutes = Math.floor(timeSec / 60);
  const seconds = timeSec % 60;

  const filteredAnswers = filterLevel === 'ALL' 
    ? answers 
    : answers.filter(a => a.level === Number(filterLevel));

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-gray-800 flex justify-between items-start bg-gray-950/60">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-white">
                {participant?.fullName || 'Student Details'}
              </h2>
              {session && (
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  session.status === 'COMPLETED' ? 'bg-green-900/60 text-green-400 border border-green-700/60' :
                  session.status === 'ELIMINATED' ? 'bg-red-900/60 text-red-400 border border-red-700/60' :
                  'bg-blue-900/60 text-blue-400 border border-blue-700/60'
                }`}>
                  {session.status}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-1">
              Roll No: <span className="font-mono text-indigo-400 font-semibold">{participant?.participantId}</span>
              {participant?.collegeName && ` • ${participant.collegeName}`}
              {participant?.department && ` • ${participant.department}`}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-3.5 py-1.5 rounded-lg bg-red-900/40 hover:bg-red-900/80 text-red-300 border border-red-700/50 text-xs font-bold transition-colors flex items-center gap-1.5"
            >
              <span>🗑️</span>
              <span>{deleting ? 'Deleting...' : 'Delete Student'}</span>
            </button>
            <button
              onClick={onClose}
              className="w-9 h-9 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 flex items-center justify-center font-bold text-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading ? (
            <div className="py-16 text-center text-gray-400">Loading student details & questions...</div>
          ) : error ? (
            <div className="p-4 bg-red-900/30 border border-red-800 text-red-300 rounded-xl text-center">{error}</div>
          ) : (
            <>
              {/* Score & Session Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                <div className="bg-gray-800/60 border border-gray-700/50 p-3 rounded-xl text-center">
                  <div className="text-gray-400 text-xs uppercase font-semibold">Total Points</div>
                  <div className="text-2xl font-black text-yellow-400 mt-0.5">{session?.totalScore ?? 0}</div>
                </div>
                <div className="bg-gray-800/60 border border-gray-700/50 p-3 rounded-xl text-center">
                  <div className="text-gray-400 text-xs uppercase font-semibold">Level 1</div>
                  <div className="text-xl font-bold text-indigo-400 mt-0.5">{session?.level1Score ?? 0} pts</div>
                </div>
                <div className="bg-gray-800/60 border border-gray-700/50 p-3 rounded-xl text-center">
                  <div className="text-gray-400 text-xs uppercase font-semibold">Level 2</div>
                  <div className="text-xl font-bold text-red-400 mt-0.5">{session?.level2Score ?? 0} pts</div>
                </div>
                <div className="bg-gray-800/60 border border-gray-700/50 p-3 rounded-xl text-center">
                  <div className="text-gray-400 text-xs uppercase font-semibold">Level 3</div>
                  <div className="text-xl font-bold text-yellow-400 mt-0.5">{session?.level3Score ?? 0} pts</div>
                </div>
                <div className="bg-gray-800/60 border border-gray-700/50 p-3 rounded-xl text-center">
                  <div className="text-gray-400 text-xs uppercase font-semibold">Lives Left</div>
                  <div className="text-base font-bold text-red-400 mt-1">
                    {[1, 2, 3].map(h => (
                      <span key={h} className={h <= (session?.lives ?? 3) ? 'opacity-100' : 'opacity-25 grayscale'}>❤️</span>
                    ))}
                  </div>
                </div>
                <div className="bg-gray-800/60 border border-gray-700/50 p-3 rounded-xl text-center">
                  <div className="text-gray-400 text-xs uppercase font-semibold">Time Taken</div>
                  <div className="text-base font-bold text-gray-200 mt-1">
                    {timeSec > 0 ? `${minutes}m ${seconds}s` : 'Active / N/A'}
                  </div>
                </div>
                <div className={`border p-3 rounded-xl text-center ${
                  (session?.violationCount || 0) > 0 
                    ? 'bg-red-950/40 border-red-800/60' 
                    : 'bg-gray-800/60 border-gray-700/50'
                }`}>
                  <div className="text-gray-400 text-xs uppercase font-semibold">Violations</div>
                  <div className={`text-xl font-bold mt-0.5 ${
                    (session?.violationCount || 0) > 0 ? 'text-red-400' : 'text-green-400'
                  }`}>
                    {(session?.violationCount || 0) > 0 
                      ? `⚠️ ${session.violationCount}` 
                      : '✓ Clean'}
                  </div>
                </div>
              </div>

              {/* Timing Metadata */}
              <div className="bg-gray-950/60 border border-gray-800 p-4 rounded-xl flex flex-wrap gap-6 text-xs text-gray-400">
                <div>
                  <span className="text-gray-500 font-semibold uppercase mr-1">Registered:</span>
                  <span>{participant?.registeredAt ? new Date(participant.registeredAt).toLocaleString() : 'N/A'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold uppercase mr-1">Started Quiz:</span>
                  <span>{session?.startTime ? new Date(session.startTime).toLocaleString() : 'Not started'}</span>
                </div>
                <div>
                  <span className="text-gray-500 font-semibold uppercase mr-1">Finished:</span>
                  <span>{session?.endTime ? new Date(session.endTime).toLocaleString() : (session?.status?.startsWith('ACTIVE') ? 'In Progress' : 'N/A')}</span>
                </div>
              </div>

              {/* Questions Attended Section */}
              <div>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>Questions Attended</span>
                    <span className="text-xs font-semibold bg-gray-800 text-gray-300 px-2.5 py-0.5 rounded-full">
                      {answers.length} Total Attempts
                    </span>
                  </h3>

                  {/* Level Filter Tabs */}
                  <div className="flex bg-gray-950 p-1 rounded-lg border border-gray-800 text-xs font-semibold">
                    {['ALL', '1', '2', '3'].map(lvl => (
                      <button
                        key={lvl}
                        onClick={() => setFilterLevel(lvl)}
                        className={`px-3 py-1 rounded-md transition-colors ${
                          filterLevel === lvl 
                            ? 'bg-indigo-600 text-white shadow' 
                            : 'text-gray-400 hover:text-white'
                        }`}
                      >
                        {lvl === 'ALL' ? 'All Levels' : `Level ${lvl}`}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredAnswers.length === 0 ? (
                  <div className="bg-gray-950/40 border border-gray-800 p-8 rounded-xl text-center text-gray-400 text-sm">
                    No questions recorded for this level filter.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredAnswers.map((ans, index) => {
                      const q = ans.question || {};
                      return (
                        <div 
                          key={ans._id || index}
                          className={`p-4 rounded-xl border transition-all ${
                            ans.isCorrect 
                              ? 'bg-green-950/20 border-green-900/40 hover:border-green-800/60' 
                              : 'bg-red-950/20 border-red-900/40 hover:border-red-800/60'
                          }`}
                        >
                          <div className="flex flex-wrap justify-between items-start gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                ans.level === 1 ? 'bg-indigo-900/60 text-indigo-300 border border-indigo-700/50' :
                                ans.level === 2 ? 'bg-red-900/60 text-red-300 border border-red-700/50' :
                                'bg-yellow-900/60 text-yellow-300 border border-yellow-700/50'
                              }`}>
                                Level {ans.level}
                              </span>
                              {q.category && (
                                <span className="text-xs text-gray-400 font-semibold bg-gray-800/80 px-2 py-0.5 rounded">
                                  {q.category}
                                </span>
                              )}
                              {q.subcategory && (
                                <span className="text-xs text-red-400 font-semibold bg-red-900/30 px-2 py-0.5 rounded">
                                  Table {q.subcategory}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3">
                              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold flex items-center gap-1 ${
                                ans.isCorrect 
                                  ? 'bg-green-900/50 text-green-300 border border-green-700/50' 
                                  : 'bg-red-900/50 text-red-300 border border-red-700/50'
                              }`}>
                                {ans.isCorrect ? '✓ Correct' : '✕ Incorrect'}
                              </span>
                              <span className="font-bold text-sm text-yellow-400">
                                {ans.pointsAwarded > 0 ? `+${ans.pointsAwarded}` : '0'} pts
                              </span>
                            </div>
                          </div>

                          <div className="text-gray-100 text-sm font-medium mb-3">
                            {q.questionText || 'Question text not available'}
                          </div>

                          {q.codeSnippet && (
                            <pre className="bg-gray-950 border border-gray-800 p-3 rounded-lg text-xs font-mono text-gray-300 overflow-x-auto mb-3">
                              <code>{q.codeSnippet}</code>
                            </pre>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-gray-950/60 p-2.5 rounded-lg border border-gray-800/60">
                            <div>
                              <span className="text-gray-400 font-semibold">Submitted Answer: </span>
                              <span className={`font-mono font-bold ${ans.isCorrect ? 'text-green-400' : 'text-red-400'}`}>
                                {ans.submittedAnswer || '<empty>'}
                              </span>
                            </div>
                            {!ans.isCorrect && q.correctAnswer && (
                              <div>
                                <span className="text-gray-400 font-semibold">Correct Answer: </span>
                                <span className="font-mono font-bold text-green-400">
                                  {q.correctAnswer}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-800 bg-gray-950/60 flex justify-between items-center">
          <div className="text-xs text-gray-500 font-mono">
            Session ID: {session?._id || 'N/A'}
          </div>
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 text-white font-bold text-sm transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default ParticipantDetailModal;
