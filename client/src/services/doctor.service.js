import httpClient from '../api/Axios';

export const getDoctorDashboard = async () => {
  const response = await httpClient.get('/doctor/dashboard');
  return response.data?.data || response.data;
};
