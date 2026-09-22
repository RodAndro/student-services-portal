import type { ReactNode } from "react";
import { BADGE_TONES } from "./tones";
import type { BadgeTone } from "./tones";

export interface BadgeProps {
  tone?: BadgeTone;
  children: ReactNode;
}

/**
 * Status pill.
 *
 * Colour is decoration only: the badge always contains the status **text**, and a
 * leading dot adds a shape difference as well. Nothing is communicated by colour
 * alone (and the dot is aria-hidden so it is not read out as noise).
 */
export function Badge({ tone = "neutral", children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE_TONES[tone]}`}
    >
      <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-current opacity-70" />
      {children}
    </span>
  );
}
