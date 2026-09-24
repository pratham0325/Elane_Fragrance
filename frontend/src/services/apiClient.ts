import axios from 'axios';

const API_URL = (import.meta.env.VITE_API_URL || 'https://elane-fragrance.onrender.com')
  .replace(/\/+$/, '')
  .replace(/\/api$/, '');

export const apiClient = axios.create({
  baseURL: `${API_URL}/api`,
  withCredentials: true,
});

// Phase 3 will add: request interceptor to attach access token,
// response interceptor to handle 401 -> refresh token flow.
