/**
 * Holds the current dashboard user in memory. On mount, it asks the
 * backend "who am I?" via the session cookie (`fetchCurrentUser`) rather
 * than trusting any client-stored state — the cookie is httpOnly, so the
 * frontend has no other way to know if a session is still valid.
 */

import { useCallback, useEffect, useState } from 'react';
import * as authService from '../services/authService';
import { AuthContext } from './authContext';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    authService
      .fetchCurrentUser()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const loggedInUser = await authService.login(credentials);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const register = useCallback(async (details) => {
    await authService.register(details);
    // Registration doesn't start a session by itself — the caller sends
    // the user to the login page next.
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  const value = { user, isLoading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
