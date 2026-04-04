import axios from 'axios';
import { getCookie } from '../utils/cookies';

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost/api';

const httpClient = axios.create({
  baseURL: apiBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

httpClient.interceptors.request.use((config) => {
  const token = getCookie('hb_access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default httpClient;
