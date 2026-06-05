const STORAGE_KEY = 'loancompass_access_token';
const REFRESH_KEY = 'loancompass_refresh_token';

export function getAccessToken(): string | null {
  try {
    const fromLocal = localStorage.getItem(STORAGE_KEY);
    if (fromLocal) {
      return fromLocal;
    }

    // Backward compatibility for sessions created before localStorage migration.
    const fromSession = sessionStorage.getItem(STORAGE_KEY);
    if (fromSession) {
      localStorage.setItem(STORAGE_KEY, fromSession);
      sessionStorage.removeItem(STORAGE_KEY);
      return fromSession;
    }

    return null;
  } catch {
    return null;
  }
}

export function setAccessToken(token: string): void {
  try {
    localStorage.setItem(STORAGE_KEY, token);
  } catch {
    sessionStorage.setItem(STORAGE_KEY, token);
  }
}

export function clearAccessToken(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

export function setRefreshToken(token: string): void {
  try {
    localStorage.setItem(REFRESH_KEY, token);
  } catch {
    // ignore
  }
}

export function clearRefreshToken(): void {
  try {
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    // ignore
  }
}

