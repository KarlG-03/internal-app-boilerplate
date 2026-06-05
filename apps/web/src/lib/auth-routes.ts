export const SIGN_IN_PATH = '/signin';
export const SIGN_UP_PATH = '/signup';

export function signInHref(email?: string): string {
  const trimmed = email?.trim();
  return trimmed
    ? `${SIGN_IN_PATH}?email=${encodeURIComponent(trimmed)}`
    : SIGN_IN_PATH;
}

export function signUpHref(email?: string): string {
  const trimmed = email?.trim();
  return trimmed
    ? `${SIGN_UP_PATH}?email=${encodeURIComponent(trimmed)}`
    : SIGN_UP_PATH;
}
