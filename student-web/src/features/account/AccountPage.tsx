import type { ReactNode } from "react";
import { authApi } from "../../api";
import { unwrap } from "../../api/unwrap";
import { DataState } from "../../components/data/DataState";
import { useApiQuery } from "../../hooks/useApiQuery";
import { Alert } from "../../components/ui/Alert";
import { Card } from "../../components/ui/Card";
import { formatDateTime, humanizeStatus } from "../../lib/format";
import type { AuthUser } from "../../types/api";

/**
 * Account page - what the backend can actually tell us about the signed-in user.
 *
 * Available to every role because it only uses GET /auth/me. There is deliberately no
 * editable form: the API exposes no endpoint to change a user's name, email, password
 * or role, and no password-reset endpoint. Inventing an "update profile" screen would
 * be a lie, so the page is read-only and says so.
 */
export function AccountPage() {
  const query = useApiQuery(() => authApi.me().then(unwrap), []);

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-800">My account</h2>
        <p className="mt-1 text-sm text-slate-600">
          The account information the API holds for the signed-in user (GET /auth/me).
        </p>
      </div>

      <DataState
        loading={query.loading}
        error={query.error}
        data={query.data}
        onRetry={query.refetch}
        emptyTitle="No account data"
      >
        {(user) => (
          <>
            <Card title="Account details">
              <AccountDetails user={user} />
            </Card>

            <Card title="Your access">
              <AccessSummary user={user} />
            </Card>
          </>
        )}
      </DataState>

      <Alert tone="info" title="Read-only by design">
        <p>
          This API has no endpoint for editing a user profile, changing a password, or resetting
          one. Accounts and roles are managed by the administrator outside the API, so nothing on
          this page is editable.
        </p>
      </Alert>
    </div>
  );
}

function AccountDetails({ user }: { user: AuthUser }) {
  return (
    <dl className="grid gap-4 sm:grid-cols-2">
      <Detail label="Name" value={user.name} />
      <Detail label="Email" value={user.email} />
      <Detail label="Role" value={humanizeStatus(user.role)} />
      <Detail label="Status" value={humanizeStatus(user.status)} />
      <Detail label="Account id" value={<span className="font-mono">{user.id}</span>} />
      <Detail label="Email verified" value={formatDateTime(user.email_verified_at)} />
      <Detail label="Created" value={formatDateTime(user.created_at)} />
      <Detail label="Last updated" value={formatDateTime(user.updated_at)} />
    </dl>
  );
}

/** Mirrors the backend's policy matrix (docs/API-CONTRACT.md §4) for this role. */
function AccessSummary({ user }: { user: AuthUser }) {
  const can = (roles: string[]) => (roles.includes(user.role) ? "Yes" : "No");

  return (
    <table className="min-w-full text-sm">
      <thead>
        <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
          <th scope="col" className="py-2 pr-4">
            Area
          </th>
          <th scope="col" className="py-2">
            Allowed for {humanizeStatus(user.role)}
          </th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100">
        <AccessRow
          label="Programs, Courses, Academic Terms (read)"
          allowed={can(["admin", "registrar", "instructor"])}
        />
        <AccessRow
          label="Programs, Courses, Academic Terms (create / edit / delete)"
          allowed={can(["admin", "registrar"])}
        />
        <AccessRow label="Students (full)" allowed={can(["admin", "registrar"])} />
        <AccessRow
          label="Course Offerings (read)"
          allowed={can(["admin", "registrar", "instructor"])}
        />
        <AccessRow
          label="Course Offerings (create / edit / delete)"
          allowed={can(["admin", "registrar"])}
        />
        <AccessRow
          label="Enrollments (create / edit / delete)"
          allowed={can(["admin", "registrar"])}
        />
        <AccessRow
          label="Grades (record / edit)"
          allowed={can(["admin", "registrar", "instructor"])}
        />
        <AccessRow
          label="Own profile, enrollments, grades, academic record"
          allowed={can(["student"])}
        />
      </tbody>
    </table>
  );
}

function AccessRow({ label, allowed }: { label: string; allowed: string }) {
  return (
    <tr>
      <td className="py-2 pr-4 text-slate-700">{label}</td>
      <td
        className={`py-2 font-medium ${allowed === "Yes" ? "text-emerald-700" : "text-slate-400"}`}
      >
        {allowed}
      </td>
    </tr>
  );
}

function Detail({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
      <dd className="mt-0.5 text-sm text-slate-800">{value}</dd>
    </div>
  );
}
