import {
  clearAccessToken,
  clearRefreshToken,
  getAccessToken,
  getRefreshToken,
  setAccessToken,
  setRefreshToken,
} from '@/lib/auth-token';

/** API origin baked in at build time (VITE_API_URL). Empty → relative URLs (wrong on static admin host). */
export function getApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
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

export function requireApiBaseUrl(): string {
  const base = getApiBaseUrl();
  if (!base) {
    throw new Error(
      'Admin app is not connected to the API. Set VITE_API_URL on the static site service (e.g. https://api.loancompass.app) and redeploy.',
    );
  }
  return base;
}

function baseHeaders(tokenOverride?: string): Record<string, string> {
  const h: Record<string, string> = { 'Content-Type': 'application/json' };
  const token = tokenOverride ?? getAccessToken();
  if (token) h.Authorization = `Bearer ${token}`;
  return h;
}

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

export async function adminFetch<T>(
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
    window.dispatchEvent(new Event('auth:session-expired'));
    throw new Error('Session expired. Please log in again.');
  }

  if (!res.ok) throw new Error(await parseError(res));
  const text = await res.text();
  if (!text) return undefined as T;
  return JSON.parse(text) as T;
}
