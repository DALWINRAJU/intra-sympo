import api from './api';

export const getCurrentSession = async () => {
  const response = await api.get('/session/current');
  return response.data;
};

export const startSession = async () => {
  const response = await api.post('/session/start');
  return response.data;
};
