import axios from 'axios';

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:5000/api',
  withCredentials: true
});

// Phase 3 will add: request interceptor to attach access token,
// response interceptor to handle 401 -> refresh token flow.
