import httpClient from '../api/Axios';

export const loginRequest = async (payload) => {
  const response = await httpClient.post('/auth/login', payload);
  return response.data?.data || response.data;
};

export const registerRequest = async (payload) => {
  const response = await httpClient.post('/auth/register', payload);
  return response.data?.data || response.data;
};

export const getMeRequest = async () => {
  const response = await httpClient.get('/auth/me');
  return response.data?.data || response.data;
};
