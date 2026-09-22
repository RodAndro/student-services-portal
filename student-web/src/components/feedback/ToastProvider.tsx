import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { ToastContext } from "./toastContext";
import type { Toast, ToastContextValue, ToastTone } from "./toastContext";

const TONES: Record<ToastTone, { wrapper: string; icon: string }> = {
  success: { wrapper: "border-emerald-200 bg-white text-emerald-900", icon: "text-emerald-600" },
  error: { wrapper: "border-red-200 bg-white text-red-900", icon: "text-red-600" },
  info: { wrapper: "border-brand-200 bg-white text-brand-900", icon: "text-brand-600" }
};

const ICONS: Record<ToastTone, string> = {
  success: "M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
  error: "M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z",
  info: "M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
};

const AUTO_DISMISS_MS = 5000;

/**
 * Success/failure feedback after a mutation. The message shown is normally the
 * one the API returned in its envelope, so the wording always matches the backend.
 *
 * The stack is an `aria-live` region, so a message is announced when it appears;
 * each toast also has a dismiss button for pointer and keyboard users.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextIdRef = useRef(1);
  const timersRef = useRef<number[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const show = useCallback(
    (toast: Omit<Toast, "id">) => {
      const id = nextIdRef.current;
      nextIdRef.current += 1;

      setToasts((current) => [...current, { ...toast, id }]);

      const timer = window.setTimeout(() => dismiss(id), AUTO_DISMISS_MS);
      timersRef.current.push(timer);
    },
    [dismiss]
  );

  // Clear pending timers when the provider unmounts (also keeps tests clean).
  useEffect(() => {
    const timers = timersRef.current;
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, []);

  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        aria-live="polite"
        aria-atomic="false"
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:items-end"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className={`pointer-events-auto w-full max-w-sm rounded-xl border px-4 py-3 shadow-lg ${TONES[toast.tone].wrapper}`}
          >
            <div className="flex items-start gap-3">
              <svg
                className={`mt-0.5 h-4 w-4 shrink-0 ${TONES[toast.tone].icon}`}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                aria-hidden="true"
                focusable="false"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d={ICONS[toast.tone]} />
              </svg>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{toast.title}</p>
                {toast.description ? (
                  <p className="mt-0.5 text-xs text-slate-600">{toast.description}</p>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                aria-label="Dismiss notification"
                className="rounded px-1 text-xs font-medium text-slate-500 underline hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
              >
                Dismiss
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
