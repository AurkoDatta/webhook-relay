/**
 * API call for an application's aggregate analytics.
 */

import apiClient from './apiClient';

export async function getApplicationStats(applicationId) {
  const { data } = await apiClient.get(`/api/applications/${applicationId}/stats`);
  return data.stats;
}
