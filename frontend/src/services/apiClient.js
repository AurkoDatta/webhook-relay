/**
 * Shared axios instance. `withCredentials: true` is required on every
 * request so the browser sends the httpOnly session cookie the backend
 * sets on login — without it, every authenticated dashboard call would
 * silently 401 even right after a successful login.
 */

import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  withCredentials: true,
});

/**
 * Normalizes the backend's `{ error: { code, message } }` shape into a
 * plain Error with `.code` and `.message` set, so callers can just
 * `catch (err) { setError(err.message) }` without unpacking `err.response`
 * everywhere.
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const apiError = error.response?.data?.error;
    if (apiError) {
      const normalized = new Error(apiError.message);
      normalized.code = apiError.code;
      normalized.status = error.response.status;
      return Promise.reject(normalized);
    }
    return Promise.reject(error);
  }
);

export default apiClient;
