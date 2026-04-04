import httpClient from '../api/Axios';

export const getAdminDashboard = async () => {
  const response = await httpClient.get('/auth/admin/users');
  return response.data?.data || response.data;
};
