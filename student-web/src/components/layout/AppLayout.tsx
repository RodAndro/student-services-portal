import { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { APP_NAME, API_BASE_URL } from "../../config/env";
import { humanizeStatus } from "../../lib/format";
import { Badge } from "../ui/Badge";
import { Button } from "../ui/Button";
import { groupNavItems, navItemsForRole } from "./navigation";

/**
 * Application shell.
 *
 * - `lg` and up: a permanent sidebar next to the content (desktop / wide tablet).
 * - below `lg`: the sidebar becomes a drawer with a backdrop, closed by Escape, by
 *   the backdrop or by choosing a link.
 * - Semantic landmarks (`<header>`, `<nav>`, `<main>`, `<footer>`) plus a skip link,
 *   so keyboard users can jump straight to the content.
 */
export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  // Only the links this role is allowed to use, grouped for the sidebar.
  const sections = groupNavItems(navItemsForRole(user?.role));

  useEffect(() => {
    if (!menuOpen) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  async function handleLogout() {
    setSigningOut(true);
    await logout();
    setSigningOut(false);
    setMenuOpen(false);
    navigate("/login", { replace: true });
  }

  return (
    <div className="min-h-screen bg-canvas lg:flex">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[70] focus:rounded-md focus:bg-white focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-brand-700 focus:shadow-lg"
      >
        Skip to main content
      </a>

      {menuOpen ? (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
        />
      ) : null}

      <aside
        aria-label="Sidebar"
        className={`${
          menuOpen ? "fixed inset-y-0 left-0 z-40 block w-72 overflow-y-auto" : "hidden"
        } shrink-0 border-r border-slate-200 bg-white lg:sticky lg:top-0 lg:block lg:h-screen lg:w-64 lg:overflow-y-auto`}
      >
        <div className="flex items-start justify-between gap-2 border-b border-slate-200 px-5 py-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-700">
              Activity III
            </p>
            <p className="mt-1 text-sm font-semibold leading-snug text-slate-800">{APP_NAME}</p>
            <p className="mt-0.5 text-xs text-slate-500">Laravel REST API client</p>
          </div>

          {menuOpen ? (
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              aria-label="Close navigation"
              className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-slate-500 hover:bg-slate-100 lg:hidden"
            >
              <span aria-hidden="true">✕</span>
            </button>
          ) : null}
        </div>

        <nav aria-label="Main navigation" className="px-3 py-4">
          {sections.map((section) => (
            <div key={section.title} className="mb-5 last:mb-0">
              <h2 className="px-2 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </h2>

              <ul className="space-y-0.5">
                {section.items.map((item) => (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.end}
                      onClick={() => setMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-2 rounded-md px-2.5 py-2 text-sm font-medium transition-colors ${
                          isActive
                            ? "bg-brand-50 text-brand-700 ring-1 ring-inset ring-brand-200"
                            : "text-slate-600 hover:bg-slate-100 hover:text-slate-800"
                        }`
                      }
                    >
                      {item.label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">
          <p className="font-medium text-slate-600">API base URL</p>
          <p className="mt-0.5 break-all font-mono">{API_BASE_URL}</p>
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-expanded={menuOpen}
              aria-label="Open navigation"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-300 text-slate-600 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 lg:hidden"
            >
              <span aria-hidden="true">☰</span>
            </button>

            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold text-slate-900">{APP_NAME}</h1>
              <p className="truncate text-xs text-slate-500">Student information management</p>
            </div>
          </div>

          {user ? (
            <div className="flex flex-wrap items-center gap-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium text-slate-800">{user.name}</p>
                <p className="truncate text-xs text-slate-500">{user.email}</p>
              </div>

              <Badge tone="info">{humanizeStatus(user.role)}</Badge>

              <Button variant="secondary" size="sm" loading={signingOut} onClick={handleLogout}>
                Sign out
              </Button>
            </div>
          ) : null}
        </header>

        <main id="main-content" className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <Outlet />
        </main>

        <footer className="border-t border-slate-200 px-4 py-4 text-xs text-slate-500 sm:px-6 lg:px-8">
          Activity III · AI-Assisted Frontend Integration with an Existing REST API
        </footer>
      </div>
    </div>
  );
}
