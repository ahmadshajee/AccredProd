import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);
const STORAGE_KEY = 'accredchain_session';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : { token: '', user: null };
  });
  const [institution, setInstitution] = useState(null);
  const [loading, setLoading] = useState(Boolean(session.token));

  useEffect(() => {
    async function loadProfile() {
      if (!session.token) {
        setLoading(false);
        return;
      }

      try {
        const data = await authApi.me(session.token);
        setSession((current) => ({ ...current, user: data.user }));
        setInstitution(data.institution || null);
      } catch {
        localStorage.removeItem(STORAGE_KEY);
        setSession({ token: '', user: null });
        setInstitution(null);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [session.token]);

  const value = useMemo(
    () => ({
      token: session.token,
      user: session.user,
      institution,
      loading,
      async login(payload) {
        const data = await authApi.login(payload);
        const nextSession = { token: data.token, user: data.user };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
        setInstitution(data.institution || null);
        return data;
      },
      async register(payload) {
        const data = await authApi.register(payload);
        const nextSession = { token: data.token, user: data.user };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSession));
        setSession(nextSession);
        setInstitution(null);
        return data;
      },
      async refreshProfile() {
        if (!session.token) {
          return null;
        }
        const data = await authApi.me(session.token);
        setSession((current) => ({ ...current, user: data.user }));
        setInstitution(data.institution || null);
        return data;
      },
      logout() {
        localStorage.removeItem(STORAGE_KEY);
        setSession({ token: '', user: null });
        setInstitution(null);
      },
    }),
    [institution, loading, session]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider.');
  }

  return context;
}
