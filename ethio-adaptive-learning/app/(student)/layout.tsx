import Link from "next/link"

import { StudentSidebar } from "@/components/student/student-sidebar"
import { UserMenu } from "@/components/shared/user-menu"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function StudentLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const session = await requireRole("STUDENT")
  const profile = await prisma.userProfile.findUnique({
    where: {
      userId: session.user.id,
    },
  })

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,_#f7fbfa_0%,_#eef5f2_100%)]">
      <header className="border-b border-border/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div>
            <Link className="text-lg font-semibold tracking-tight text-foreground" href="/dashboard">
              Ethio Adaptive Learning
            </Link>
            <p className="text-sm text-muted-foreground">Student-only routes</p>
          </div>

          <UserMenu username={session.user.username} role={session.user.role} />
        </div>
      </header>

      <main className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[320px_minmax(0,1fr)]">
        <StudentSidebar
          username={session.user.username}
          level={profile?.currentLevel ?? 1}
          xp={profile?.totalXP ?? 0}
          streak={profile?.dailyStreak ?? 0}
        />
        <section>{children}</section>
      </main>
    </div>
  )
}
