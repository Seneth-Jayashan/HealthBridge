import httpClient from '../api/Axios';

export const getPatientDashboard = async () => {
  const response = await httpClient.get('/patient/dashboard');
  return response.data?.data || response.data;
};
