import { useAdminAuditLog } from '../../hooks/admin/useAdminAuditLog'

const ACTION_LABELS: Record<string, string> = {
  'user.suspend': 'Suspended user',
  'user.reactivate': 'Reactivated user',
  'settings.update': 'Updated settings',
}

export function AdminAuditLogPage() {
  const { entries, loaded } = useAdminAuditLog()

  return (
    <div className="flex flex-col gap-5">
      <h1 className="font-display text-xl font-semibold text-ink-strong">Audit log</h1>

      <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-room-2">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-ink-soft">
              <th className="px-4 py-3 font-semibold">When</th>
              <th className="px-4 py-3 font-semibold">Admin</th>
              <th className="px-4 py-3 font-semibold">Action</th>
              <th className="px-4 py-3 font-semibold">Target</th>
            </tr>
          </thead>
          <tbody>
            {loaded && entries.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-ink-soft">
                  No admin activity yet.
                </td>
              </tr>
            )}
            {entries.map((entry) => (
              <tr key={entry.id} className="border-b border-[var(--color-border-subtle)] last:border-0">
                <td className="px-4 py-3 text-ink-soft tabular-nums">{new Date(entry.createdAt).toLocaleString()}</td>
                <td className="px-4 py-3 text-ink-strong">{entry.actorEmail}</td>
                <td className="px-4 py-3 text-ink-strong">{ACTION_LABELS[entry.action] ?? entry.action}</td>
                <td className="px-4 py-3 text-ink-soft">
                  {entry.targetType ? `${entry.targetType}${entry.targetId ? ` · ${entry.targetId}` : ''}` : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
