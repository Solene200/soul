const ACCESS_TOKEN_KEY = 'access_token';
const USERNAME_KEY = 'username';
export const AUTH_UNAUTHORIZED_EVENT = 'auth:unauthorized';

function canUseStorage() {
  return typeof window !== 'undefined';
}

export function getAccessToken() {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function hasAccessToken() {
  return Boolean(getAccessToken());
}

export function saveAuthSession(accessToken: string, username?: string | null) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);

  if (username) {
    window.localStorage.setItem(USERNAME_KEY, username);
  }
}

export function clearAuthSession() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem(ACCESS_TOKEN_KEY);
  window.localStorage.removeItem(USERNAME_KEY);
}

export function notifyUnauthorized() {
  if (!canUseStorage()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
}
