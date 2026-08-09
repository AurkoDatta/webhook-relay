/**
 * API calls for delivery attempt history and manual replay.
 */

import apiClient from './apiClient';

export async function getAttemptHistory(deliveryId) {
  const { data } = await apiClient.get(`/api/deliveries/${deliveryId}/attempts`);
  return data.attempts;
}

export async function replayDelivery(deliveryId) {
  const { data } = await apiClient.post(`/api/deliveries/${deliveryId}/replay`);
  return data.delivery;
}
