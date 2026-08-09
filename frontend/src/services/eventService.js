/**
 * API calls for event listing and detail.
 */

import apiClient from './apiClient';

/**
 * @param {string} applicationId
 * @param {{ eventType?: string, from?: string, to?: string, page?: number, pageSize?: number }} filters
 */
export async function listEvents(applicationId, filters = {}) {
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null));
  const { data } = await apiClient.get(`/api/applications/${applicationId}/events`, { params });
  return data; // { events, pagination }
}

export async function getEvent(eventId) {
  const { data } = await apiClient.get(`/api/events/${eventId}`);
  return data.event; // includes .deliveries fan-out summary
}
