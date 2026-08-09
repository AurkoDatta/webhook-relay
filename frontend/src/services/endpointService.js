/**
 * API calls for subscriber endpoint management, scoped to an application.
 */

import apiClient from './apiClient';

export async function createEndpoint(applicationId, { url, description, subscribedEventTypes }) {
  const { data } = await apiClient.post(`/api/applications/${applicationId}/endpoints`, {
    url,
    description,
    subscribedEventTypes,
  });
  return data.endpoint;
}

export async function listEndpoints(applicationId) {
  const { data } = await apiClient.get(`/api/applications/${applicationId}/endpoints`);
  return data.endpoints;
}

export async function updateEndpoint(endpointId, updates) {
  const { data } = await apiClient.put(`/api/endpoints/${endpointId}`, updates);
  return data.endpoint;
}

export async function deleteEndpoint(endpointId) {
  await apiClient.delete(`/api/endpoints/${endpointId}`);
}
