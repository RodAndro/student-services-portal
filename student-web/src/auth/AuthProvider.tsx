import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { authApi } from "../api";
import { toApiError } from "../lib/errors";
import { setUnauthorizedHandler } from "../lib/http";
import { clearSession, getToken, setStoredUser, setToken } from "../lib/storage";
import type { AuthUser, UserRole } from "../types/api";
import { AuthContext } from "./context";
import type { AuthContextValue, AuthStatus } from "./context";

/**
 * Holds the session for the whole app.
 *
 * How it works with this backend (Laravel Sanctum, opaque bearer token):
 *
 *  - Sign in  -> POST /auth/login returns a plaintext token + the user; both are stored.
 *  - Refresh  -> if a token is stored, GET /auth/me confirms it is still valid and rehydrates
 *                the user, so a page refresh does not log the user out.
 *  - 401      -> any request answering 401 is handled in one place here: the session is
 *                cleared and the user is sent back to the login screen with a notice.
 *  - Sign out -> POST /auth/logout revokes the token server-side; local state is cleared even
 *                if that call fails.
 *
 * There is no refresh token and tokens do not expire on their own, so no silent-renew logic.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(() => (getToken() ? "loading" : "anonymous"));
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sessionExpired, setSessionExpired] = useState(false);

  // Has the user already been signed in during this page lifetime? Used to decide
  // whether a 401 means "your session ended" or just "you are not signed in".
  const wasAuthenticatedRef = useRef(false);
  useEffect(() => {
    if (status === "authenticated") {
      wasAuthenticatedRef.current = true;
    }
  }, [status]);

  // Rehydrate the session from a stored token on first load.
  useEffect(() => {
    // No token: the initial state is already "anonymous", nothing to verify.
    if (!getToken()) {
      return;
    }

    let cancelled = false;

    authApi
      .me()
      .then(({ data }) => {
        if (cancelled) {
          return;
        }
        setUser(data);
        setStoredUser(data);
        setStatus("authenticated");
      })
      .catch((caught: unknown) => {
        if (cancelled) {
          return;
        }

        const apiError = toApiError(caught);

        // Rejected credentials: drop the token and explain why on the login screen.
        if (apiError.status === 401 || apiError.status === 403) {
          clearSession();
          setUser(null);
          setSessionExpired(true);
          setStatus("anonymous");
          return;
        }

        // The API could not be reached. Do not destroy the stored token - a later
        // refresh can retry - but do not pretend the user is signed in either.
        setUser(null);
        setStatus("anonymous");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  /** Single place that reacts to a 401 from any request. */
  const handleUnauthorized = useCallback(() => {
    const hadSession = wasAuthenticatedRef.current || getToken() !== null;
    clearSession();
    setUser(null);
    setStatus("anonymous");

    if (hadSession) {
      setSessionExpired(true);
    }
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(handleUnauthorized);
    return () => setUnauthorizedHandler(null);
  }, [handleUnauthorized]);

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await authApi.login({ email, password });

    setToken(data.token);
    setStoredUser(data.user);
    setUser(data.user);
    setSessionExpired(false);
    setStatus("authenticated");
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Revocation may fail (already revoked, server down). The local session is
      // dropped regardless, so the user is never stuck in a signed-in state.
    }

    clearSession();
    setUser(null);
    setSessionExpired(false);
    setStatus("anonymous");
  }, []);

  const isRole = useCallback(
    (...roles: UserRole[]) => (user ? roles.includes(user.role) : false),
    [user]
  );

  const clearSessionExpired = useCallback(() => setSessionExpired(false), []);

  const value = useMemo<AuthContextValue>(
    () => ({ status, user, login, logout, isRole, sessionExpired, clearSessionExpired }),
    [status, user, login, logout, isRole, sessionExpired, clearSessionExpired]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
