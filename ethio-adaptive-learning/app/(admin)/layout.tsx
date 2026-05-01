import Link from "next/link"

import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { UserMenu } from "@/components/shared/user-menu"
import { requireRole } from "@/lib/auth"

export default async function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f7fbfa_0%,_#eef5f2_100%)]">
      <header className="border-b border-border/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <Link className="text-lg font-semibold tracking-tight text-foreground" href="/admin/dashboard">
              Ethio Adaptive Learning
            </Link>
            <p className="text-sm text-muted-foreground">Admin and course-writer routes</p>
          </div>

          <UserMenu username={session.user.username} role={session.user.role} />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <AdminSidebar role={session.user.role} />
        <section>{children}</section>
      </main>
    </div>
  )
}
