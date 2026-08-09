import { useContext } from 'react';
import { AuthContext } from '../context/AuthContextValue';

/** Reads the current dashboard user and auth actions from AuthContext. */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
