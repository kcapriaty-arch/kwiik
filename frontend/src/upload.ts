import { api } from './api';

interface UploadResponse {
  url: string;
}

async function envoyerFichier(file: File, endpoint: string): Promise<string> {
  const formData = new FormData();
  formData.append('fichier', file);

  const { data } = await api.post<UploadResponse>(endpoint, formData);
  return data.url;
}

export async function uploaderImage(file: File): Promise<string> {
  return envoyerFichier(file, '/upload');
}

export async function uploaderImagePrivee(file: File): Promise<string> {
  return envoyerFichier(file, '/upload/prive');
}