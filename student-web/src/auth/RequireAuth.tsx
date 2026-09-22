import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { FullPageLoader } from "../components/ui/FullPageLoader";
import { useAuth } from "./useAuth";

/**
 * Blocks a route until the user is signed in.
 *
 * While a stored token is being verified the app shows a loader instead of
 * bouncing to /login, which is what stops a browser refresh from looking like a
 * logout. The attempted URL is remembered so sign-in can return to it.
 */
export function RequireAuth({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const location = useLocation();

  if (status === "loading") {
    return <FullPageLoader message="Restoring your session…" />;
  }

  if (status === "anonymous") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <>{children}</>;
}
