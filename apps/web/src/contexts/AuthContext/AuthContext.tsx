import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { apiJson, requireApiBaseUrl } from '@/lib/api';
import {
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/lib/auth-token';
import type { Me } from '@/lib/types';

export function defaultHomePath(): string {
  return '/dashboard';
}

type AuthPayload = {
  access_token: string;
  refresh_token?: string;
  emailVerified: boolean;
};

type AuthState = {
  token: string | null;
  accountEmail: string | null;
  emailVerified: boolean | null;
  canDeleteAccount: boolean;
  profileResolved: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: (credential: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  resendVerificationEmail: () => Promise<void>;
  applyVerifiedSession: (payload: AuthPayload) => void;
};

const AuthContext = createContext<AuthState | null>(null);

async function parseAuthError(res: Response): Promise<string> {
  let message = res.statusText;
  try {
    const body = (await res.json()) as { message?: string | string[] };
    if (typeof body.message === 'string') {
      message = body.message;
    } else if (Array.isArray(body.message)) {
      message = body.message.join(', ');
    }
  } catch {
    const t = await res.text();
    if (t) {
      message = t;
    }
  }
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => getAccessToken());
  const [emailVerified, setEmailVerified] = useState<boolean | null>(null);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [canDeleteAccount, setCanDeleteAccount] = useState(false);
  const [profileResolved, setProfileResolved] = useState<boolean>(() => !token);

  const refreshProfile = useCallback(async () => {
    const me = await apiJson<Me>('/api/auth/me');
    setEmailVerified(me.emailVerified);
    setAccountEmail(me.email);
    setCanDeleteAccount(me.canDeleteAccount);
  }, []);

  useEffect(() => {
    const handler = () => {
      clearAccessToken();
      clearRefreshToken();
      setToken(null);
      setEmailVerified(null);
      setAccountEmail(null);
      setCanDeleteAccount(false);
      setProfileResolved(true);
    };
    window.addEventListener('auth:session-expired', handler);
    return () => window.removeEventListener('auth:session-expired', handler);
  }, []);

  useEffect(() => {
    if (!token) {
      setEmailVerified(null);
      setAccountEmail(null);
      setCanDeleteAccount(false);
      setProfileResolved(true);
      return;
    }
    setProfileResolved(false);
    let cancelled = false;
    (async () => {
      try {
        const me = await apiJson<Me>('/api/auth/me');
        if (!cancelled) {
          setEmailVerified(me.emailVerified);
          setAccountEmail(me.email);
          setCanDeleteAccount(me.canDeleteAccount);
        }
      } catch {
        if (!cancelled) {
          setEmailVerified(false);
          setAccountEmail(null);
          setCanDeleteAccount(false);
        }
      } finally {
        if (!cancelled) {
          setProfileResolved(true);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${requireApiBaseUrl()}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new Error(await parseAuthError(res));
    }
    const data = (await res.json()) as AuthPayload;
    setAccessToken(data.access_token);
    if (data.refresh_token) setRefreshToken(data.refresh_token);
    setToken(data.access_token);
    setEmailVerified(data.emailVerified);
    setProfileResolved(false);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${requireApiBaseUrl()}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      throw new Error(await parseAuthError(res));
    }
    const data = (await res.json()) as AuthPayload;
    setAccessToken(data.access_token);
    if (data.refresh_token) setRefreshToken(data.refresh_token);
    setToken(data.access_token);
    setEmailVerified(data.emailVerified);
    setProfileResolved(false);
  }, []);

  const signInWithGoogle = useCallback(async (credential: string) => {
    const res = await fetch(`${requireApiBaseUrl()}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential }),
    });
    if (!res.ok) {
      throw new Error(await parseAuthError(res));
    }
    const data = (await res.json()) as AuthPayload;
    setAccessToken(data.access_token);
    if (data.refresh_token) setRefreshToken(data.refresh_token);
    setToken(data.access_token);
    setEmailVerified(data.emailVerified);
    setProfileResolved(false);
  }, []);

  const logout = useCallback(() => {
    const refreshToken = getRefreshToken();
    clearAccessToken();
    clearRefreshToken();
    setToken(null);
    setEmailVerified(null);
    setAccountEmail(null);
    setCanDeleteAccount(false);
    setProfileResolved(true);
    if (refreshToken) {
      void fetch(`${requireApiBaseUrl()}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      }).catch(() => undefined);
    }
  }, []);

  const resendVerificationEmail = useCallback(async () => {
    await apiJson('/api/auth/resend-verification', { method: 'POST' });
    await refreshProfile();
  }, [refreshProfile]);

  const applyVerifiedSession = useCallback((payload: AuthPayload) => {
    setAccessToken(payload.access_token);
    if (payload.refresh_token) setRefreshToken(payload.refresh_token);
    setToken(payload.access_token);
    setEmailVerified(payload.emailVerified);
    setProfileResolved(false);
  }, []);

  const value = useMemo(
    () => ({
      token,
      accountEmail,
      emailVerified,
      canDeleteAccount,
      profileResolved,
      signIn,
      signInWithGoogle,
      signUp,
      logout,
      isAuthenticated: !!token,
      resendVerificationEmail,
      applyVerifiedSession,
    }),
    [
      token,
      accountEmail,
      emailVerified,
      canDeleteAccount,
      profileResolved,
      signIn,
      signInWithGoogle,
      signUp,
      logout,
      resendVerificationEmail,
      applyVerifiedSession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
