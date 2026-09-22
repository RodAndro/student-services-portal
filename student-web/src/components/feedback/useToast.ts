import { useContext } from "react";
import { ToastContext } from "./toastContext";
import type { ToastContextValue } from "./toastContext";

/** Access the toast queue. Must be used inside <ToastProvider>. */
export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }

  return context;
}
