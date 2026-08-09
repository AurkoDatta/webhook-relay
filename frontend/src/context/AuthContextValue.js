import { createContext } from 'react';

/** Split into its own module so AuthContext.jsx can export only the provider component (keeps Fast Refresh happy). */
export const AuthContext = createContext(null);
