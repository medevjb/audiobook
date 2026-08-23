import { Link } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

/** Self-sufficient like `ThemeToggle`/`UserMenu` — renders nothing for a non-admin. */
export function AdminLink() {
  const role = useAuthStore((s) => s.user?.role)
  if (role !== 'admin') return null

  return (
    <Link
      to="/admin"
      className="inline-flex h-9 items-center rounded-xl border border-amber-500/25 bg-room-3/80 px-3 text-xs font-semibold text-brass-strong shadow-xs transition-all duration-200 hover:border-amber-500/50 hover:bg-amber-500/15 hover:shadow-md"
    >
      Admin
    </Link>
  )
}
