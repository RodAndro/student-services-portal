/** Badge colour tones and the mapping from a backend status string to a tone. */

export type BadgeTone = "neutral" | "success" | "warning" | "danger" | "info";

export const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "bg-slate-100 text-slate-700 ring-slate-200",
  success: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  warning: "bg-amber-50 text-amber-900 ring-amber-200",
  danger: "bg-red-50 text-red-800 ring-red-200",
  info: "bg-brand-50 text-brand-800 ring-brand-200"
};

/**
 * Maps the status values the API actually returns to a tone. The badge also shows
 * the status text and a dot, so the tone is a hint, never the only signal.
 */
export function statusTone(status: string | null | undefined): BadgeTone {
  switch (status) {
    case "ACTIVE":
    case "ENROLLED":
    case "PASSED":
      return "success";
    case "UPCOMING":
    case "IN PROGRESS":
      return "info";
    case "INACTIVE":
    case "DROPPED":
      return "neutral";
    case "FAILED":
      return "danger";
    default:
      return "neutral";
  }
}
