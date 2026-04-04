import Link from "next/link"
import { BookOpenCheck, ChartColumn, Clock3, Network, UserCircle2 } from "lucide-react"

type StudentSidebarProps = {
  username: string
  level: number
  xp: number
  streak: number
}

const studentLinks = [
  { href: "/dashboard", label: "Dashboard", icon: ChartColumn },
  { href: "/concepts", label: "Concepts", icon: Network },
  { href: "/learn", label: "Learn", icon: BookOpenCheck },
  { href: "/review", label: "Review", icon: Clock3 },
  { href: "/profile", label: "Profile", icon: UserCircle2 },
]

export function StudentSidebar({
  username,
  level,
  xp,
  streak,
}: StudentSidebarProps) {
  return (
    <aside className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
        Student Space
      </p>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight">{username}</h2>

      <div className="mt-6 grid gap-3">
        <div className="rounded-2xl bg-secondary p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Level</p>
          <p className="mt-2 text-2xl font-semibold">{level}</p>
        </div>
        <div className="rounded-2xl bg-secondary p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">XP</p>
          <p className="mt-2 text-2xl font-semibold">{xp}</p>
        </div>
        <div className="rounded-2xl bg-secondary p-4">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Streak</p>
          <p className="mt-2 text-2xl font-semibold">{streak}</p>
        </div>
      </div>

      <nav className="mt-8 space-y-2">
        {studentLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
