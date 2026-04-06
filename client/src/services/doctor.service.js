import httpClient from '../api/Axios';

export const getDoctorDashboard = async () => {
  const response = await httpClient.get('/doctors/profile');
  return response.data?.data || response.data;
};
