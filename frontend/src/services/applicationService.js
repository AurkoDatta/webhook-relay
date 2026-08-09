/**
 * API calls for application (tenant namespace) management.
 */

import apiClient from './apiClient';

export async function createApplication({ name }) {
  const { data } = await apiClient.post('/api/applications', { name });
  return data; // { application, signingSecret, apiKey } — secret/key shown once
}

export async function listApplications() {
  const { data } = await apiClient.get('/api/applications');
  return data.applications;
}

export async function getApplication(id) {
  const { data } = await apiClient.get(`/api/applications/${id}`);
  return data.application;
}

export async function rotateSigningSecret(id) {
  const { data } = await apiClient.post(`/api/applications/${id}/rotate-secret`);
  return data; // { application, signingSecret }
}

export async function rotateApiKey(id) {
  const { data } = await apiClient.post(`/api/applications/${id}/rotate-api-key`);
  return data; // { application, apiKey }
}
