import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestion, submitAnswer } from '../../services/quizService';
import { useCompetition } from '../../hooks/useCompetition';

const Level3Page = () => {
  const navigate = useNavigate();
  const { fetchSession } = useCompetition();

  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [guessedOutput, setGuessedOutput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); 

  const loadQuestion = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getQuestion();
      setQuestionData(data);
      setGuessedOutput('');
      setFeedback(null);
    } catch (err) {
      if (err.response?.data?.message === 'Level 3 already completed') {
        await fetchSession(); // Context auto-routes to /result
      } else {
        setError(err.response?.data?.message || 'Failed to load question');
      }
    } finally {
      setLoading(false);
    }
  }, [fetchSession]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (!guessedOutput.trim()) return;
    try {
      setSubmitting(true);
      const data = await submitAnswer(questionData.question._id, guessedOutput);
      
      setFeedback({
        isCorrect: data.isCorrect,
        correctAnswer: data.correctAnswer,
        isCompetitionComplete: data.isCompetitionComplete,
        pointsAwarded: data.pointsAwarded
      });
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (feedback?.isCompetitionComplete) {
      await fetchSession(); // Context will auto-route to /result
    } else {
      loadQuestion();
    }
  };

  if (loading) return <div className="text-center text-white py-12 text-lg">Loading Code Challenge...</div>;
  if (error) return <div className="text-red-400 text-center py-12 text-lg">{error}</div>;
  if (!questionData) return null;

  const { question, currentIndex, totalQuestions } = questionData;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="mb-6 flex justify-between items-end">
        <h2 className="text-2xl font-bold text-yellow-500">Level 3: Guess the Output</h2>
        <span className="text-gray-400 font-medium bg-gray-800 px-3 py-1 rounded-full text-sm">
          Challenge {currentIndex + 1} of {totalQuestions}
        </span>
      </div>

      <div className="card mb-6 border-yellow-900/30">
        <div className="mb-2 text-sm text-yellow-500 font-semibold uppercase tracking-wider flex justify-between">
          <span>{question.category}</span>
          <span>{question.language}</span>
        </div>
        <h3 className="text-xl text-gray-100 mb-4 font-medium leading-relaxed">
          {question.questionText}
        </h3>

        {question.codeSnippet && (
          <div className="mb-6 rounded-lg bg-gray-950 border border-gray-800 overflow-hidden shadow-inner">
            <div className="bg-gray-800 px-4 py-2 flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span className="ml-2 text-xs text-gray-400 font-mono">code_snippet.{question.language === 'python' ? 'py' : 'java'}</span>
            </div>
            <pre className="p-4 overflow-x-auto text-gray-300 text-sm code-block">
              <code>{question.codeSnippet}</code>
            </pre>
          </div>
        )}

        {!feedback ? (
          <form onSubmit={handleSubmit}>
            <label className="label mb-2" htmlFor="guessedOutput">Expected Output:</label>
            <textarea 
              id="guessedOutput"
              rows="4"
              className="input-field font-mono"
              placeholder="Type the exact output here..."
              value={guessedOutput}
              onChange={(e) => setGuessedOutput(e.target.value)}
              disabled={submitting}
              autoFocus
            />
          </form>
        ) : (
          <div className="space-y-4 border-t border-gray-800 pt-6">
            <div className="mb-2">
              <label className="label text-gray-400">Your Answer:</label>
              <div className={`p-3 rounded-lg border font-mono whitespace-pre-wrap ${feedback.isCorrect ? 'bg-green-900/20 border-green-800/50 text-gray-300' : 'bg-red-900/20 border-red-800/50 text-gray-300'}`}>
                {guessedOutput || '<empty>'}
              </div>
            </div>
            {!feedback.isCorrect && (
              <div>
                <label className="label text-green-400">Correct Answer:</label>
                <div className="p-3 rounded-lg border bg-green-900/20 border-green-800/50 text-green-300 font-mono whitespace-pre-wrap">
                  {feedback.correctAnswer}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {!feedback ? (
        <button 
          onClick={handleSubmit} 
          disabled={!guessedOutput.trim() || submitting}
          className="btn-primary w-full text-lg py-4 bg-yellow-600 hover:bg-yellow-500 focus-visible:outline-yellow-500 border-none"
        >
          {submitting ? 'Submitting...' : 'Submit Output'}
        </button>
      ) : (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border text-center font-bold text-lg ${feedback.isCorrect ? 'bg-green-900/30 border-green-600 text-green-400' : 'bg-red-900/30 border-red-600 text-red-400'}`}>
            {feedback.isCorrect 
              ? `Correct! +${feedback.pointsAwarded} Points` 
              : 'Incorrect! 0 Points'}
          </div>
          <button onClick={handleNext} className="btn-primary w-full text-lg py-4 bg-yellow-600 hover:bg-yellow-500 border-none">
            {feedback.isCompetitionComplete 
              ? 'Finish Competition ➔' 
              : 'Next Challenge ➔'}
          </button>
        </div>
      )}
    </div>
  );
};
export default Level3Page;
