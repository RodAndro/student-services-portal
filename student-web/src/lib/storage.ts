/**
 * Token/session persistence.
 *
 * The token is an opaque Sanctum bearer token. It is kept in localStorage so a
 * page refresh does not log the user out (which also keeps the demo smooth).
 * The trade-off versus sessionStorage is recorded in the AI development log:
 * localStorage is readable by any script on the page, so this app renders no
 * untrusted HTML and never injects third-party scripts.
 */

const TOKEN_KEY = "sim.token";
const USER_KEY = "sim.user";

/**
 * localStorage can throw (private mode, disabled storage). Never let that break
 * the app - fall back to "no stored session".
 */
function safeRead(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeWrite(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* storage unavailable - the session simply will not persist */
  }
}

function safeRemove(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function getToken(): string | null {
  const token = safeRead(TOKEN_KEY);
  return token && token.length > 0 ? token : null;
}

export function setToken(token: string): void {
  safeWrite(TOKEN_KEY, token);
}

export function getStoredUser<T>(): T | null {
  const raw = safeRead(USER_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function setStoredUser(user: unknown): void {
  safeWrite(USER_KEY, JSON.stringify(user));
}

/** Remove every trace of the session (used by logout and by a 401 response). */
export function clearSession(): void {
  safeRemove(TOKEN_KEY);
  safeRemove(USER_KEY);
}
