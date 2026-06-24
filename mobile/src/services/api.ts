import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import { storageGet, STORAGE_KEYS } from '../utils/storage';
import type { Currency } from '../types';

const PRODUCTION_API_URL = 'https://www.prela-atelier.com';

function isLocalhostUrl(value: string) {
  return /^https?:\/\/(localhost|127\.0\.0\.1|\[?::1\]?)(:\d+)?/i.test(value);
}

function resolveBaseUrl() {
  const configuredUrl = process.env.EXPO_PUBLIC_API_URL?.trim();

  if (!configuredUrl || isLocalhostUrl(configuredUrl)) {
    return PRODUCTION_API_URL;
  }

  return configuredUrl.replace(/\/+$/, '');
}

export const API_BASE_URL = resolveBaseUrl();

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15_000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client': 'prela-mobile/1.0',
  },
  withCredentials: false,
});

api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const currency = await storageGet<Currency>(STORAGE_KEYS.CURRENCY);
    if (currency) {
      config.headers['X-Currency'] = currency;
    }

    const token = await storageGet<string>(STORAGE_KEYS.USER_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data as { error?: string } | undefined;

      const message =
        data?.error ??
        (status === 404
          ? 'Resource not found'
          : status === 401
            ? 'Unauthorised'
            : status === 422
              ? 'Validation error'
              : status >= 500
                ? 'Server error - please try again'
                : 'Request failed');

      return Promise.reject(new Error(message));
    }

    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timed out'));
    }

    return Promise.reject(new Error(`Network error - check your connection (${API_BASE_URL})`));
  },
);

export default api;
