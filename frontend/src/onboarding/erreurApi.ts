import type { AxiosError } from 'axios';

interface ApiErreur {
  message?: string | string[];
}

export function extraireMessageErreur(error: unknown, fallback: string): string {
  const axiosError = error as AxiosError<ApiErreur>;
  const message = axiosError.response?.data?.message;

  if (Array.isArray(message)) {
    return message.join(' ');
  }

  return message ?? fallback;
}
