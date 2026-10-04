import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestion, submitAnswer, advanceLevel } from '../../services/quizService';
import { useCompetition } from '../../hooks/useCompetition';
import CompetitionTimer from '../../components/common/CompetitionTimer';

const Level2Page = () => {
  const navigate = useNavigate();
  const { session, refreshScore } = useCompetition();

  const [questionData, setQuestionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedOption, setSelectedOption] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null); 

  const loadQuestion = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const data = await getQuestion();
      setQuestionData(data);
      setSelectedOption('');
      setFeedback(null);
    } catch (err) {
      if (err.response?.data?.message === 'Level 2 already completed') {
        navigate('/level/3'); 
      } else {
        setError(err.response?.data?.message || 'Failed to load question');
      }
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadQuestion();
  }, [loadQuestion]);

  const handleSubmit = async () => {
    if (!selectedOption) return;
    try {
      setSubmitting(true);
      const data = await submitAnswer(questionData.question._id, selectedOption);
      
      setFeedback({
        isCorrect: data.isCorrect,
        correctAnswer: data.correctAnswer,
        isLevelComplete: data.isLevelComplete,
        isEliminated: data.isEliminated,
        pointsAwarded: data.pointsAwarded,
        livesRemaining: data.lives
      });
      refreshScore();
      
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (feedback?.isEliminated) {
      navigate('/result');
    } else if (feedback?.isLevelComplete) {
      try {
        await advanceLevel(3);
        navigate('/level/3');
      } catch (err) {
        setError('Failed to advance to Level 3');
      }
    } else {
      loadQuestion();
    }
  };

  if (loading) return <div className="text-center text-white py-12 text-lg">Loading Exit Room...</div>;
  if (error) return <div className="text-red-400 text-center py-12 text-lg">{error}</div>;
  if (!questionData || !questionData.question) return null;

  const { question, currentIndex, totalQuestions } = questionData;
  const timerStart = session?.startTime || questionData.startTime;
  // Safe fallback: if lives not yet in response, use 3 as default
  const currentLives = feedback?.livesRemaining ?? questionData.lives ?? 3;

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="text-2xl font-bold text-red-500 mb-2">Level 2: Exit Room</h2>
          <span className="text-gray-400 font-medium bg-gray-800 px-3 py-1 rounded-full text-sm">
            Step {currentIndex + 1} of {totalQuestions}
          </span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {timerStart && <CompetitionTimer startTime={timerStart} />}
          <div className="bg-gray-900 border border-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 shadow-lg">
            <span className="text-gray-300 text-sm uppercase tracking-wider font-bold mr-2">Lives:</span>
            <div className="flex gap-1 text-xl">
              {[1, 2, 3].map(heart => (
                <span key={heart} className={heart <= currentLives ? 'text-red-500' : 'text-gray-700 opacity-30 grayscale'}>
                  ❤️
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-6 border-red-900/30">
        <div className="mb-2 text-sm text-red-400 font-semibold uppercase tracking-wider">
          {question.category}
        </div>
        <h3 className="text-xl text-gray-100 mb-6 font-medium leading-relaxed">
          {question.questionText}
        </h3>

        <div className="space-y-3">
          {question.options.map((opt) => {
            let btnClass = "w-full text-left p-4 rounded-lg border transition-all duration-200 ";
            
            if (feedback) {
              if (opt.label === feedback.correctAnswer) {
                btnClass += "bg-green-900/40 border-green-500 text-green-100";
              } else if (opt.label === selectedOption && !feedback.isCorrect) {
                btnClass += "bg-red-900/40 border-red-500 text-red-100";
              } else {
                btnClass += "bg-gray-800 border-gray-700 text-gray-400 opacity-50 cursor-not-allowed";
              }
            } else {
              if (selectedOption === opt.label) {
                btnClass += "bg-red-900/50 border-red-500 text-white";
              } else {
                btnClass += "bg-gray-800 border-gray-700 text-gray-200 hover:border-gray-500 hover:bg-gray-700 cursor-pointer";
              }
            }

            return (
              <button
                key={opt.label}
                disabled={!!feedback || submitting}
                onClick={() => setSelectedOption(opt.label)}
                className={btnClass}
              >
                <div className="flex items-center text-left">
                  <span className="font-bold w-8 text-gray-400 shrink-0">{opt.label}.</span>
                  <span>{opt.text}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {!feedback ? (
        <button 
          onClick={handleSubmit} 
          disabled={!selectedOption || submitting}
          className="btn-danger w-full text-lg py-4"
        >
          {submitting ? 'Submitting...' : 'Submit Answer'}
        </button>
      ) : (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border text-center font-bold text-lg ${feedback.isCorrect ? 'bg-green-900/30 border-green-600 text-green-400' : 'bg-red-900/30 border-red-600 text-red-400'}`}>
            {feedback.isCorrect 
              ? `Correct! +${feedback.pointsAwarded} Points` 
              : feedback.isEliminated 
                ? 'Incorrect! You lost your last life!' 
                : 'Incorrect! -1 Life'}
          </div>
          <button onClick={handleNext} className="btn-primary w-full text-lg py-4">
            {feedback.isEliminated 
              ? 'View Final Results ➔' 
              : feedback.isLevelComplete 
                ? 'Continue to Level 3 ➔' 
                : 'Next Step ➔'}
          </button>
        </div>
      )}
    </div>
  );
};
export default Level2Page;
