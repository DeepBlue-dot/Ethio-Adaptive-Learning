import Link from "next/link"
import { BookMarked, LayoutDashboard, Network, SquareTerminal, Users } from "lucide-react"
import type { UserRole } from "@prisma/client"

const adminLinks = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/cms/concepts", label: "CMS Concepts", icon: Network },
  { href: "/admin/cms/questions", label: "CMS Questions", icon: BookMarked },
]

const platformLinks = [{ href: "/admin/users", label: "Users", icon: Users }]

type AdminSidebarProps = {
  role: UserRole
}

export function AdminSidebar({ role }: AdminSidebarProps) {
  return (
    <aside className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-950 p-3 text-white">
          <SquareTerminal className="size-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
            Admin Console
          </p>
          <p className="text-sm text-muted-foreground">Protected platform operations</p>
        </div>
      </div>

      <nav className="mt-8 space-y-2">
        {adminLinks.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
          >
            <Icon className="size-4" />
            {label}
          </Link>
        ))}

        {role === "ADMIN" ? (
          <>
            <p className="px-4 pt-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Platform
            </p>
            {platformLinks.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                <Icon className="size-4" />
                {label}
              </Link>
            ))}
          </>
        ) : null}
      </nav>
    </aside>
  )
}
