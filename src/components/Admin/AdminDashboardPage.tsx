import { Link } from 'react-router-dom'
import { useAdminAuditLog } from '../../hooks/admin/useAdminAuditLog'
import { useAdminUsers } from '../../hooks/admin/useAdminUsers'

const ACTION_LABELS: Record<string, string> = {
  'user.suspend': 'Suspended user',
  'user.reactivate': 'Reactivated user',
  'user.role_change': 'Changed role',
  'settings.update': 'Updated settings',
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-room-2 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-soft">{label}</p>
      <p className="mt-2 font-display text-3xl font-normal text-ink-strong tabular-nums">{value}</p>
    </div>
  )
}

export function AdminDashboardPage() {
  const { users, loaded: usersLoaded } = useAdminUsers()
  const { entries, loaded: auditLoaded } = useAdminAuditLog()

  const activeCount = users.filter((u) => u.status === 'active').length
  const suspendedCount = users.filter((u) => u.status === 'suspended').length
  const adminCount = users.filter((u) => u.role === 'admin').length

  return (
    <div className="flex flex-col gap-8">
      <h1 className="font-display text-xl font-semibold text-ink-strong">Dashboard</h1>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label="Total users" value={usersLoaded ? users.length : 0} />
        <StatCard label="Active" value={usersLoaded ? activeCount : 0} />
        <StatCard label="Suspended" value={usersLoaded ? suspendedCount : 0} />
        <StatCard label="Admins" value={usersLoaded ? adminCount : 0} />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Recent activity</h2>
          <Link to="/admin/audit-log" className="text-xs font-semibold text-brass-strong hover:underline">
            View all
          </Link>
        </div>

        <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-room-2">
          {auditLoaded && entries.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-ink-soft">No admin activity yet.</p>
          )}
          <ul>
            {entries.slice(0, 5).map((entry) => (
              <li
                key={entry.id}
                className="flex items-center justify-between gap-4 border-b border-[var(--color-border-subtle)] px-4 py-3 text-sm last:border-0"
              >
                <span className="text-ink-strong">
                  <span className="font-medium">{entry.actorEmail}</span>{' '}
                  <span className="text-ink-soft">{ACTION_LABELS[entry.action] ?? entry.action}</span>
                </span>
                <span className="shrink-0 text-xs text-ink-soft tabular-nums">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  )
}
