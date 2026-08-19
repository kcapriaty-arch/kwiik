import axios from 'axios';

const apiHost = window.location.hostname || 'localhost';
const urlBackend = `http://${apiHost}:3000`;

export const api = axios.create({
  baseURL: urlBackend,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('kwiik_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Resout une URL d'image relative (ex. /uploads/xyz.png) renvoyee par l'API
// en URL absolue vers le backend. Laisse intactes les URLs deja absolues.
export function urlImage(chemin: string): string {
  return chemin.startsWith('http://') || chemin.startsWith('https://') ? chemin : `${urlBackend}${chemin}`;
}
