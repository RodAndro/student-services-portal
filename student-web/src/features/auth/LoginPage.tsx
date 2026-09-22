import { useState } from "react";
import type { FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/useAuth";
import { Alert } from "../../components/ui/Alert";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/ui/Field";
import { FullPageLoader } from "../../components/ui/FullPageLoader";
import { Input } from "../../components/ui/Input";
import { APP_NAME, API_BASE_URL } from "../../config/env";
import { toApiError } from "../../lib/errors";

/** Seeded development accounts (see ../student-api/docs/demo-script.md). */
const DEMO_ACCOUNTS = [
  { role: "Administrator", email: "admin@example.com" },
  { role: "Registrar", email: "registrar@example.com" },
  { role: "Instructor", email: "instructor@example.com" },
  { role: "Student", email: "student@example.com" }
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface LoginLocationState {
  from?: { pathname?: string };
}

/**
 * Sign-in screen.
 *
 * The backend authenticates with POST /auth/login (email + password) and answers with
 * a Sanctum bearer token. Wrong credentials return 422 with an `email` error, and a
 * deactivated account returns 403 - both are shown exactly as the API sends them.
 */
export function LoginPage() {
  const { login, status, sessionExpired, clearSessionExpired } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const state = location.state as LoginLocationState | null;
  const redirectTo = state?.from?.pathname ?? "/";

  // Already signed in (or restoring a session): do not show the form.
  if (status === "authenticated") {
    return <Navigate to={redirectTo} replace />;
  }

  if (status === "loading") {
    return <FullPageLoader message="Restoring your session…" />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    // Client-side checks mirror the backend rules; the server's 422 always wins.
    const errors: Record<string, string> = {};
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      errors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      errors.email = "Enter a valid email address.";
    }

    if (!password) {
      errors.password = "Password is required.";
    }

    setFieldErrors(errors);
    setFormError(null);
    clearSessionExpired();

    if (Object.keys(errors).length > 0) {
      return;
    }

    // `submitting` disables the button, so the form cannot be submitted twice.
    setSubmitting(true);

    try {
      await login(trimmedEmail, password);
      navigate(redirectTo, { replace: true });
    } catch (caught: unknown) {
      const apiError = toApiError(caught);

      if (apiError.fieldErrors) {
        const flattened: Record<string, string> = {};
        for (const [field, messages] of Object.entries(apiError.fieldErrors)) {
          flattened[field] = messages.join(" ");
        }
        setFieldErrors(flattened);
      }

      setFormError(apiError.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-md">
        <header className="mb-6 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white shadow-sm">
            SIM
          </span>
          <h1 className="mt-3 text-xl font-semibold tracking-tight text-slate-900">{APP_NAME}</h1>
          <p className="mt-1 text-sm text-slate-600">
            Sign in with an account issued by the administrator. There is no self-registration.
          </p>
        </header>

        <div className="space-y-4">
          {sessionExpired ? (
            <Alert tone="warning" title="Your session has ended">
              <p>The saved sign-in is no longer valid. Please sign in again.</p>
            </Alert>
          ) : null}

          {formError ? (
            <Alert tone="danger" title="Sign-in failed">
              <p>{formError}</p>
            </Alert>
          ) : null}

          <form
            onSubmit={handleSubmit}
            noValidate
            className="space-y-4 rounded-xl border border-slate-200 bg-white px-5 py-6 shadow-sm"
          >
            <Field htmlFor="email" label="Email" required error={fieldErrors.email}>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="username"
                autoFocus
                value={email}
                invalid={Boolean(fieldErrors.email)}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@example.com"
              />
            </Field>

            <Field htmlFor="password" label="Password" required error={fieldErrors.password}>
              <Input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                value={password}
                invalid={Boolean(fieldErrors.password)}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </Field>

            <Button type="submit" loading={submitting} className="w-full">
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <section className="rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              Development accounts
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Seeded by the backend for this activity. Password for all of them:{" "}
              <code className="rounded bg-slate-100 px-1 py-0.5 font-mono">password</code>
            </p>

            <ul className="mt-3 space-y-1.5 text-sm">
              {DEMO_ACCOUNTS.map((account) => (
                <li
                  key={account.email}
                  className="flex flex-wrap items-center justify-between gap-2"
                >
                  <span className="text-slate-600">{account.role}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setEmail(account.email);
                      setPassword("password");
                      setFieldErrors({});
                      setFormError(null);
                    }}
                    className="rounded font-mono text-xs text-brand-700 underline hover:text-brand-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500"
                  >
                    {account.email}
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <p className="text-center text-xs text-slate-500">
            API: <span className="font-mono">{API_BASE_URL}</span>
          </p>
        </div>
      </div>
    </div>
  );
}
