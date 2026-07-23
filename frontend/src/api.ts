import axios from 'axios';

const apiHost = window.location.hostname || 'localhost';

export const api = axios.create({
  baseURL: `http://${apiHost}:3000`,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kwiik_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
