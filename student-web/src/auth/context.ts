import { createContext } from "react";
import type { AuthUser, UserRole } from "../types/api";

/** `loading` = we are checking a stored token against the API. */
export type AuthStatus = "loading" | "authenticated" | "anonymous";

export interface AuthContextValue {
  status: AuthStatus;
  user: AuthUser | null;
  /** Signs in with the real backend. Throws a normalised ApiError on failure. */
  login: (email: string, password: string) => Promise<void>;
  /** Revokes the token on the server, then clears the local session. */
  logout: () => Promise<void>;
  /** True when the signed-in user holds one of the given roles. */
  isRole: (...roles: UserRole[]) => boolean;
  /** True when a stored token was rejected (expired/revoked) and we logged out. */
  sessionExpired: boolean;
  clearSessionExpired: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
