import { useContext } from "react";
import { AuthContext } from "./context";
import type { AuthContextValue } from "./context";

/** Access the session. Must be used inside <AuthProvider>. */
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }

  return context;
}
