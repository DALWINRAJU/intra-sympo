import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getQuestion, submitAnswer, advanceLevel } from '../../services/quizService';
import { useCompetition } from '../../hooks/useCompetition';

// Q1–5 = easy, Q6–8 = medium, Q9–10 = hard (index 0-based)
const getDifficultyZone = (index) => {
  if (index < 5) return { label: 'Easy', color: 'text-green-400', bg: 'bg-green-900/30 border-green-700/50', icon: '🟢' };
  if (index < 8) return { label: 'Moderate', color: 'text-yellow-400', bg: 'bg-yellow-900/30 border-yellow-700/50', icon: '🟡' };
  return { label: 'Hard', color: 'text-red-400', bg: 'bg-red-900/30 border-red-700/50', icon: '🔴' };
};

const Level1Page = () => {
  const navigate = useNavigate();
  const { refreshScore } = useCompetition();

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
      if (err.response?.data?.message === 'Level 1 already completed') {
        navigate('/level/2'); 
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
        pointsAwarded: data.pointsAwarded
      });
      // Refresh header score
      refreshScore();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (feedback?.isLevelComplete) {
      try {
        await advanceLevel(2);
        navigate('/level/2');
      } catch (err) {
        setError('Failed to advance to Level 2');
      }
    } else {
      loadQuestion();
    }
  };

  if (loading) return <div className="text-center text-white py-12 text-lg">Loading question...</div>;
  if (error) return <div className="text-red-400 text-center py-12 text-lg">{error}</div>;
  if (!questionData) return null;

  const { question, currentIndex, totalQuestions } = questionData;
  const zone = getDifficultyZone(currentIndex);

  return (
    <div className="max-w-3xl mx-auto w-full">
      <div className="mb-6 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Level 1: Core MCQ</h2>
        <span className="text-gray-400 font-medium bg-gray-800 px-3 py-1 rounded-full text-sm">
          Question {currentIndex + 1} of {totalQuestions}
        </span>
      </div>

      {/* Difficulty zone banner */}
      <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border mb-4 w-fit text-sm font-semibold ${zone.bg} ${zone.color}`}>
        <span>{zone.icon}</span>
        <span>{zone.label} Zone</span>
        {currentIndex === 0 && <span className="text-xs opacity-70 ml-1">— Questions 1–5</span>}
        {currentIndex === 5 && <span className="text-xs opacity-70 ml-1">— Questions 6–8</span>}
        {currentIndex === 8 && <span className="text-xs opacity-70 ml-1">— Questions 9–10</span>}
      </div>

      <div className="card mb-6">
        <div className="mb-2 text-sm text-indigo-400 font-semibold uppercase tracking-wider">
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
                btnClass += "bg-indigo-900/50 border-indigo-500 text-white";
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
          className="btn-primary w-full text-lg py-4"
        >
          {submitting ? 'Submitting...' : 'Submit Answer'}
        </button>
      ) : (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg border text-center font-bold text-lg ${feedback.isCorrect ? 'bg-green-900/30 border-green-600 text-green-400' : 'bg-red-900/30 border-red-600 text-red-400'}`}>
            {feedback.isCorrect ? `✅ Correct! +${feedback.pointsAwarded} Points` : '❌ Incorrect! 0 Points'}
          </div>
          <button onClick={handleNext} className="btn-primary w-full text-lg py-4">
            {feedback.isLevelComplete ? 'Continue to Level 2 ➔' : 'Next Question ➔'}
          </button>
        </div>
      )}
    </div>
  );
};
export default Level1Page;
