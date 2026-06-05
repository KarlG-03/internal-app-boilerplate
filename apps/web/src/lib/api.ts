import {
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/lib/auth-token';

/** API origin from VITE_API_URL (inlined at build). Must be absolute https URL, not a service slug. */
export function getApiBaseUrl(): string {
  return resolveViteApiBaseUrl(import.meta.env.VITE_API_URL);
}

export function requireApiBaseUrl(): string {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error(
      'App is not connected to the API. Set VITE_API_URL on the web static site (e.g. https://api.loancompass.app) and redeploy.',
    );
  }
  return base;
}

function resolveViteApiBaseUrl(raw: string | undefined): string {
  const trimmed = raw?.trim();
  if (!trimmed) {
    return '';
  }

  let base = trimmed.replace(/\/$/, '');
  if (base.startsWith('/')) {
    return '';
  }

  if (!/^https?:\/\//i.test(base)) {
    base = `https://${base}`;
  }

  try {
    const url = new URL(base);
    const host = url.hostname;
    if (
      !host.includes('.') &&
      host !== 'localhost' &&
      !host.startsWith('127.')
    ) {
      return '';
    }
    return url.origin;
  } catch {
    return '';
  }
}

function baseHeaders(tokenOverride?: string): Record<string, string> {
  const h: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const token = tokenOverride ?? getAccessToken();
  if (token) {
    h.Authorization = `Bearer ${token}`;
    return h;
  }
  const key = import.meta.env.VITE_API_KEY as string | undefined;
  if (key) {
    h['X-API-Key'] = key;
  }
  return h;
}

/** Try to get a fresh access token using the stored refresh token. */
async function tryRefreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(`${requireApiBaseUrl()}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) {
      clearAccessToken();
      clearRefreshToken();
      return null;
    }
    const data = (await res.json()) as {
      access_token: string;
      refresh_token?: string;
    };
    setAccessToken(data.access_token);
    if (data.refresh_token) setRefreshToken(data.refresh_token);
    return data.access_token;
  } catch {
    clearAccessToken();
    clearRefreshToken();
    return null;
  }
}

async function parseError(res: Response): Promise<string> {
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
    if (t) message = t;
  }
  return message;
}

export async function apiJson<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const mergedHeaders = new Headers(baseHeaders());
  if (init?.headers) {
    const extra = new Headers(init.headers);
    extra.forEach((v, k) => mergedHeaders.set(k, v));
  }
  const res = await fetch(`${requireApiBaseUrl()}${path}`, {
    ...init,
    headers: mergedHeaders,
  });

  if (res.status === 401 && !path.includes('/api/auth/refresh')) {
    const newToken = await tryRefreshAccessToken();
    if (newToken) {
      const retryHeaders = new Headers(baseHeaders(newToken));
      if (init?.headers) {
        const extra = new Headers(init.headers);
        extra.forEach((v, k) => retryHeaders.set(k, v));
      }
      const retryRes = await fetch(`${requireApiBaseUrl()}${path}`, {
        ...init,
        headers: retryHeaders,
      });
      if (retryRes.ok) {
        const text = await retryRes.text();
        if (!text) return undefined as T;
        return JSON.parse(text) as T;
      }
      throw new Error(await parseError(retryRes));
    }
    // Refresh failed — signal the app to log out
    window.dispatchEvent(new Event('auth:session-expired'));
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) {
    throw new Error(await parseError(res));
  }
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}

/** Unauthenticated API call (public routes, e.g. borrower portal). */
export async function publicJson<T>(path: string): Promise<T> {
  const res = await fetch(`${requireApiBaseUrl()}${path}`);
  if (!res.ok) {
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
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

