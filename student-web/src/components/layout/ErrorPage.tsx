import type { ReactNode } from "react";

export interface ErrorPageProps {
  code: number;
  title: string;
  message: string;
  /** Usually a link home; plain `<a>` for pages that may render without a router. */
  action: ReactNode;
  detail?: string;
}

/**
 * Shared layout for the 403 / 404 / 500 screens, so all three look the same.
 * The status code is written out as text as well as colouring the heading.
 */
export function ErrorPage({ code, title, message, action, detail }: ErrorPageProps) {
  return (
    <div className="mx-auto max-w-xl rounded-xl border border-slate-200 bg-white px-6 py-10 text-center shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">Error {code}</p>

      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-slate-600">{message}</p>

      {detail ? (
        <pre className="mt-4 max-h-48 overflow-auto rounded-md bg-slate-900 px-4 py-3 text-left text-xs text-slate-100">
          {detail}
        </pre>
      ) : null}

      <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>
    </div>
  );
}
