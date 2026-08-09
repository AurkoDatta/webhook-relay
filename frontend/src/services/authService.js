/**
 * API calls for the dashboard auth flow. Each function returns just the
 * data callers need, not the raw axios response.
 */

import apiClient from './apiClient';

export async function register({ name, email, password }) {
  const { data } = await apiClient.post('/api/auth/register', { name, email, password });
  return data.user;
}

export async function login({ email, password }) {
  const { data } = await apiClient.post('/api/auth/login', { email, password });
  return data.user;
}

export async function logout() {
  await apiClient.post('/api/auth/logout');
}

export async function fetchCurrentUser() {
  const { data } = await apiClient.get('/api/auth/me');
  return data.user;
}
