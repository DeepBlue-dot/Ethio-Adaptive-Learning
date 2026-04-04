import { BookOpenCheck, BrainCircuit, ChartColumn, Clock3 } from "lucide-react"

import { PlaceholderCard } from "@/components/shared/placeholder-card"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function StudentDashboardPage() {
  const session = await requireRole("STUDENT")

  const profile = await prisma.userProfile.findUnique({
    where: {
      userId: session.user.id,
    },
  })

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          Student Dashboard
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          Welcome back, {session.user.username}.
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          This route group now matches the student-focused structure: dashboard, concepts, learn,
          review, and profile all live together under the same sidebar shell.
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl bg-secondary p-5">
            <p className="text-sm text-muted-foreground">Current level</p>
            <p className="mt-2 text-3xl font-semibold">{profile?.currentLevel ?? 1}</p>
          </div>
          <div className="rounded-3xl bg-secondary p-5">
            <p className="text-sm text-muted-foreground">Total XP</p>
            <p className="mt-2 text-3xl font-semibold">{profile?.totalXP ?? 0}</p>
          </div>
          <div className="rounded-3xl bg-secondary p-5">
            <p className="text-sm text-muted-foreground">Daily streak</p>
            <p className="mt-2 text-3xl font-semibold">{profile?.dailyStreak ?? 0}</p>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <PlaceholderCard
          title="Learn"
          description="Instructional content and concept-first study paths will appear here in Phase 2."
          meta="Lesson workspace"
          icon={<BookOpenCheck className="size-5" />}
        />
        <PlaceholderCard
          title="Review"
          description="Retention-driven review sessions and spaced reinforcement will plug into this surface next."
          meta="Retention queue"
          icon={<Clock3 className="size-5" />}
        />
        <PlaceholderCard
          title="Exams"
          description="Checkpoint and mastery exam flows are planned on top of this authenticated student shell."
          meta="Assessment zone"
          icon={<BrainCircuit className="size-5" />}
        />
        <PlaceholderCard
          title="Analytics"
          description="Your mastery trends, strengths, and weak spots will surface here once activity data exists."
          meta="Progress tracking"
          icon={<ChartColumn className="size-5" />}
        />
      </section>
    </div>
  )
}
