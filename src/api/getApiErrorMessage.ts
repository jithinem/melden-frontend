import axios from 'axios';

interface ErrorResponseData {
  message?: string;
  data?: string[] | string | null;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError<ErrorResponseData>(error)) {
    const response = error.response?.data;
    if (Array.isArray(response?.data) && response.data.length) {
      return `${response.message || fallback}: ${response.data.join(', ')}`;
    }
    return response?.message || fallback;
  }

  return fallback;
}
