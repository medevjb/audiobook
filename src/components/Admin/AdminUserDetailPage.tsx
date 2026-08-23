import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAdminUserDetail } from '../../hooks/admin/useAdminUserDetail'
import { useAuthStore } from '../../store/authStore'
import { formatFileSize } from '../../utils/file'

export function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>()
  const { user, library, progress, loaded, suspend, reactivate, changeRole } = useAdminUserDetail(id)
  const currentAdminId = useAuthStore((s) => s.user?.id)
  const [statusBusy, setStatusBusy] = useState(false)
  const [roleBusy, setRoleBusy] = useState(false)

  async function handleToggleStatus() {
    if (!user) return
    setStatusBusy(true)
    try {
      if (user.status === 'active') await suspend()
      else await reactivate()
    } finally {
      setStatusBusy(false)
    }
  }

  async function handleToggleRole() {
    if (!user) return
    setRoleBusy(true)
    try {
      await changeRole(user.role === 'admin' ? 'user' : 'admin')
    } finally {
      setRoleBusy(false)
    }
  }

  if (!loaded) return <p className="text-sm text-ink-soft">Loading…</p>
  if (!user) return <p className="text-sm text-ink-soft">User not found.</p>

  const isActive = user.status === 'active'
  const isAdmin = user.role === 'admin'
  const isSelf = user.id === currentAdminId
  const progressByBook = new Map(progress.map((p) => [p.bookId, p]))

  return (
    <div className="flex flex-col gap-5">
      <Link to="/admin/users" className="text-xs font-semibold text-ink-soft hover:text-brass-strong">
        ← Back to users
      </Link>

      <div className="rounded-2xl border border-[var(--color-border)] bg-room-2 p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-xl font-semibold text-ink-strong">{user.email}</h1>
            <p className="mt-1 text-xs text-ink-soft">
              {isAdmin ? 'Admin' : 'User'} · Joined {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
          <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
              isActive ? 'bg-emerald/10 text-emerald' : 'bg-rose/10 text-rose'
            }`}
          >
            {isActive ? 'Active' : 'Suspended'}
          </span>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-[var(--color-border-subtle)] pt-5">
          <button
            type="button"
            onClick={() => void handleToggleStatus()}
            disabled={statusBusy}
            className={`rounded-xl px-4 py-2 text-sm font-semibold shadow-sm transition-all disabled:opacity-60 cursor-pointer ${
              isActive
                ? 'bg-rose/10 text-rose hover:bg-rose/15'
                : 'bg-gradient-to-r from-amber-500 via-amber-500 to-amber-600 text-room hover:shadow-md'
            }`}
          >
            {statusBusy ? 'Working…' : isActive ? 'Suspend account' : 'Reactivate account'}
          </button>

          <button
            type="button"
            onClick={() => void handleToggleRole()}
            disabled={roleBusy || isSelf}
            title={isSelf ? "You can't change your own role" : undefined}
            className="rounded-xl border border-[var(--color-border)] px-4 py-2 text-sm font-semibold text-ink-strong transition-colors hover:bg-room-3 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {roleBusy ? 'Working…' : isAdmin ? 'Demote to user' : 'Promote to admin'}
          </button>
          {isSelf && <span className="text-xs text-ink-soft">You can't change your own role.</span>}
        </div>
      </div>

      <div>
        <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-soft">Reading activity</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-[var(--color-border)] bg-room-2">
          {library.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-ink-soft">No books in this account's library.</p>
          ) : (
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-ink-soft">
                  <th className="px-4 py-3 font-semibold">Book</th>
                  <th className="px-4 py-3 font-semibold">Size</th>
                  <th className="px-4 py-3 font-semibold">Progress</th>
                  <th className="px-4 py-3 font-semibold">Last read</th>
                </tr>
              </thead>
              <tbody>
                {library.map((book) => {
                  const bookProgress = progressByBook.get(book.bookId)
                  const page = bookProgress?.currentPage ?? 0
                  return (
                    <tr key={book.bookId} className="border-b border-[var(--color-border-subtle)] last:border-0">
                      <td className="px-4 py-3 text-ink-strong">{book.filename}</td>
                      <td className="px-4 py-3 text-ink-soft">{formatFileSize(book.size)}</td>
                      <td className="px-4 py-3 text-ink-soft tabular-nums">
                        {page > 0 ? `Page ${page} / ${book.totalPages}` : 'Not started'}
                      </td>
                      <td className="px-4 py-3 text-ink-soft">
                        {bookProgress ? new Date(bookProgress.updatedAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
