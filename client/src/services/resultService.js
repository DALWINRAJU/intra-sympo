// src/services/resultService.js
import api from './api';

const getMyResult = async () => {
  const { data } = await api.get('/results/me');
  return data;
};

const getLeaderboard = async () => {
  const { data } = await api.get('/results/leaderboard');
  return data;
};

export default { getMyResult, getLeaderboard };
