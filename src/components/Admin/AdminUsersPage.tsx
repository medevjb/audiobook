import { Link } from 'react-router-dom'
import { useAdminUsers } from '../../hooks/admin/useAdminUsers'

function StatusBadge({ status }: { status: 'active' | 'suspended' }) {
  const isActive = status === 'active'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ${
        isActive ? 'bg-emerald/10 text-emerald' : 'bg-rose/10 text-rose'
      }`}
    >
      {isActive ? 'Active' : 'Suspended'}
    </span>
  )
}

export function AdminUsersPage() {
  const { users, loaded, query, setQuery } = useAdminUsers()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-xl font-semibold text-ink-strong">Users</h1>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by email…"
          className="w-64 rounded-xl border border-[var(--color-border)] bg-room-2 px-3.5 py-2 text-sm text-ink-strong outline-none transition-colors focus:border-brass/60"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-room-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3 font-semibold">Email</th>
              <th className="px-4 py-3 font-semibold">Role</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {loaded && users.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-soft">
                  No users found.
                </td>
              </tr>
            )}
            {users.map((user) => (
              <tr key={user.id} className="border-b border-[var(--color-border-subtle)] last:border-0">
                <td className="px-4 py-3">
                  <Link to={`/admin/users/${user.id}`} className="font-medium text-ink-strong hover:text-brass-strong">
                    {user.email}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{user.role}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={user.status} />
                </td>
                <td className="px-4 py-3 text-ink-soft">{new Date(user.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
