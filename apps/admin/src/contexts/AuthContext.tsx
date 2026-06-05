import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  setAccessToken,
  setRefreshToken,
} from '@/lib/auth-token';
import { adminFetch, requireApiBaseUrl } from '@/lib/api';

type AuthPayload = {
  access_token: string;
  refresh_token?: string;
  emailVerified: boolean;
};

type MeResponse = {
  email: string;
  isSuperAdmin: boolean;
};

type AuthState = {
  token: string | null;
  adminEmail: string | null;
  isAuthenticated: boolean;
  profileResolved: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [adminEmail, setAdminEmail] = useState<string | null>(null);
  const [profileResolved, setProfileResolved] = useState<boolean>(() => !getAccessToken());

  // Verify the token is for a superadmin
  useEffect(() => {
    if (!token) {
      setAdminEmail(null);
      setProfileResolved(true);
      return;
    }
    setProfileResolved(false);
    let cancelled = false;
    void (async () => {
      try {
        const me = await adminFetch<MeResponse>('/api/auth/me');
        if (!me.isSuperAdmin) {
          clearAccessToken();
          clearRefreshToken();
          if (!cancelled) {
            setToken(null);
            setAdminEmail(null);
          }
        } else if (!cancelled) {
          setAdminEmail(me.email);
        }
      } catch {
        if (!cancelled) {
          clearAccessToken();
          clearRefreshToken();
          setToken(null);
          setAdminEmail(null);
        }
      } finally {
        if (!cancelled) setProfileResolved(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    const handler = () => {
      clearAccessToken();
      clearRefreshToken();
      setToken(null);
      setAdminEmail(null);
      setProfileResolved(true);
    };
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${requireApiBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      let message = res.statusText;
      try {
        const body = (await res.json()) as { message?: string };
        if (typeof body.message === 'string') message = body.message;
      } catch { /* empty */ }
      throw new Error(message);
    }
    const data = (await res.json()) as AuthPayload;
    setAccessToken(data.access_token);
    if (data.refresh_token) setRefreshToken(data.refresh_token);
    setToken(data.access_token);
    setProfileResolved(false);
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    clearRefreshToken();
    setToken(null);
    setAdminEmail(null);
    setProfileResolved(true);
  }, []);

  const value = useMemo(
    () => ({ token, adminEmail, isAuthenticated: !!token, profileResolved, login, logout }),
    [token, adminEmail, profileResolved, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
