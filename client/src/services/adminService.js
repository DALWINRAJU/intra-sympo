import api from './api';

export const getStats = async () => {
  const { data } = await api.get('/admin/stats');
  return data;
};

export const getParticipants = async (query = '') => {
  const { data } = await api.get(`/admin/participants${query}`);
  return data;
};

export const getParticipantDetail = async (id) => {
  const { data } = await api.get(`/admin/participants/${id}`);
  return data;
};

export const deleteParticipant = async (id) => {
  const { data } = await api.delete(`/admin/participants/${id}`);
  return data;
};

export const getConfig = async () => {
  const { data } = await api.get('/admin/config');
  return data;
};

export const changeCompetitionStatus = async (status) => {
  const { data } = await api.post('/admin/competition/status', { status });
  return data;
};

export const getQuestions = async (query = '') => {
  const { data } = await api.get(`/admin/questions${query}`);
  return data;
};

export const addQuestion = async (questionData) => {
  const { data } = await api.post('/admin/questions', questionData);
  return data;
};

export const updateQuestion = async (id, questionData) => {
  const { data } = await api.put(`/admin/questions/${id}`, questionData);
  return data;
};

export const toggleQuestion = async (id) => {
  const { data } = await api.patch(`/admin/questions/${id}/toggle`);
  return data;
};

export const updateConfig = async (configData) => {
  const { data } = await api.put('/admin/config', configData);
  return data;
};

export default {
  getStats,
  getParticipants,
  getParticipantDetail,
  deleteParticipant,
  getConfig,
  updateConfig,
  changeCompetitionStatus,
  getQuestions,
  addQuestion,
  updateQuestion,
  toggleQuestion,
};
