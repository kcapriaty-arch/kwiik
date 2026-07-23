import axios from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:3000',
});

// Ajoute automatiquement le jeton JWT à chaque requête, s'il existe
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kwiik_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});