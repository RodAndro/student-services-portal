import { createContext } from "react";

export type ToastTone = "success" | "error" | "info";

export interface Toast {
  id: number;
  tone: ToastTone;
  title: string;
  description?: string;
}

export interface ToastContextValue {
  /** Shows a toast. Success feedback after a mutation usually uses the API's own message. */
  show(toast: Omit<Toast, "id">): void;
  dismiss(id: number): void;
}

export const ToastContext = createContext<ToastContextValue | null>(null);
