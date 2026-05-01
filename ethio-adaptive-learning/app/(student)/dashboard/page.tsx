import { BookOpenCheck, BrainCircuit, ChartColumn, Clock3 } from "lucide-react"
import Link from "next/link"

import { PlaceholderCard } from "@/components/shared/placeholder-card"
import { getStudentDashboardSummary } from "@/lib/assessment"
import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function StudentDashboardPage() {
  const session = await requireRole("STUDENT")

  const [profile, summary] = await Promise.all([
    prisma.userProfile.findUnique({
      where: {
        userId: session.user.id,
      },
    }),
    getStudentDashboardSummary(session.user.id),
  ])

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
          Your student shell now has a live adaptive core behind it. Unlocked concepts, review
          reminders, and concept progression all reflect the Phase 3 mastery engines.
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
        <DashboardLinkCard
          href="/learn"
          title="Learn"
          description="Open the guided pathway, practice a concept, and work through checkpoint gating toward the mastery exam."
          meta={`${summary.unlockedConceptCount} unlocked`}
          icon={<BookOpenCheck className="size-5" />}
        />
        <DashboardLinkCard
          href="/review"
          title="Review"
          description="Reinforce concepts whose effective mastery has decayed below the review threshold."
          meta={`${summary.dueReviewCount} due`}
          icon={<Clock3 className="size-5" />}
        />
        <DashboardLinkCard
          href="/concepts"
          title="Concepts"
          description="Track prerequisite unlocks, in-progress work, and which concepts have already crossed the mastery threshold."
          meta={`${summary.masteredConceptCount} mastered`}
          icon={<BrainCircuit className="size-5" />}
        />
        <PlaceholderCard
          title="Analytics"
          description="Progress trends, mastery history, and assessment analytics can now build on top of the recorded Phase 3 interactions."
          meta={`${summary.inProgressConceptCount} active`}
          icon={<ChartColumn className="size-5" />}
        />
      </section>
    </div>
  )
}

function DashboardLinkCard({
  href,
  title,
  description,
  meta,
  icon,
}: {
  href: string
  title: string
  description: string
  meta: string
  icon: React.ReactNode
}) {
  return (
    <Link href={href} className="block rounded-[2rem] border border-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">{title}</p>
        <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">{icon}</div>
      </div>
      <p className="mt-5 text-base leading-7 text-muted-foreground">{description}</p>
      <p className="mt-6 text-sm font-medium text-foreground">{meta}</p>
    </Link>
  )
}
