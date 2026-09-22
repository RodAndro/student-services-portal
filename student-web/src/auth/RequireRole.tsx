import type { ReactNode } from "react";
import { ForbiddenPage } from "../pages/ForbiddenPage";
import type { UserRole } from "../types/api";
import { useAuth } from "./useAuth";

/**
 * Blocks a route for users whose role is not allowed.
 *
 * This mirrors the backend's policy matrix (docs/API-CONTRACT.md §4). It is a
 * convenience only - the API enforces the same rules and would answer 403 anyway.
 */
export function RequireRole({ roles, children }: { roles: UserRole[]; children: ReactNode }) {
  const { user } = useAuth();

  if (!user || !roles.includes(user.role)) {
    return <ForbiddenPage />;
  }

  return <>{children}</>;
}
