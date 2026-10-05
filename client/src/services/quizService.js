import api from './api';

export const getQuestion = async () => {
  const response = await api.get('/quiz/question');
  return response.data;
};

export const submitAnswer = async (questionId, answer) => {
  const response = await api.post('/quiz/submit-answer', { questionId, answer });
  return response.data;
};

export const advanceLevel = async (targetLevel) => {
  const response = await api.post('/quiz/advance-level', { targetLevel });
  return response.data;
};

export const reportViolation = async () => {
  try {
    const response = await api.post('/quiz/report-violation');
    return response.data;
  } catch {
    // silently ignore - don't disrupt quiz UX if this fails
  }
};

