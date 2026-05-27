import Link from "next/link"
import {
  Activity,
  ArrowRight,
  BarChart3,
  BookOpen,
  Flame,
  Gauge,
  RotateCcw,
  Target,
  TimerReset,
} from "lucide-react"

import { ConceptCard } from "@/components/student/concept-card"
import {
  MasteryBar,
  formatDuration,
  formatPercent,
} from "@/components/student/student-status"
import { requireRole } from "@/lib/auth-server"
import { getStudentDashboard } from "@/lib/student/data"
import type { StudentConceptCard } from "@/lib/student/types"

export default async function StudentDashboardPage() {
  const session = await requireRole("STUDENT")
  const dashboard = await getStudentDashboard(session.user.id)
  const totalConcepts = Object.values(dashboard.conceptsByStatus).reduce(
    (count, concepts) => count + concepts.length,
    0
  )
  const progressValue =
    dashboard.profile.overallProgress > 0
      ? dashboard.profile.overallProgress / 100
      : totalConcepts > 0
        ? dashboard.analyticsSnapshot.conceptsMastered / totalConcepts
        : 0
  const nextConcepts = [
    ...dashboard.conceptsByStatus.reviewNeeded,
    ...dashboard.conceptsByStatus.inProgress,
    ...dashboard.conceptsByStatus.fringe,
  ].slice(0, 6)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-sm font-semibold text-primary">Student dashboard</p>
            <h1 className="mt-2 text-3xl font-extrabold text-on-surface">Today&apos;s learning hub</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
              Pick up the next concept, clear reviews, or jump into analytics when you want to see the full signal.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <SummaryMetric icon={Gauge} label="Level" value={String(dashboard.profile.currentLevel)} />
              <SummaryMetric icon={Target} label="Total XP" value={dashboard.profile.totalXP.toLocaleString()} />
              <SummaryMetric icon={Flame} label="Daily streak" value={`${dashboard.profile.dailyStreak} days`} />
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant/50 bg-muted p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-on-surface">Overall progress</p>
              <p className="text-2xl font-extrabold text-primary">{formatPercent(progressValue)}</p>
            </div>
            <MasteryBar className="mt-4" value={progressValue} />
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <MiniStat label="Mastered" value={dashboard.analyticsSnapshot.conceptsMastered} />
              <MiniStat label="Started" value={dashboard.analyticsSnapshot.conceptsStarted} />
              <MiniStat label="Review due" value={dashboard.conceptsByStatus.reviewNeeded.length} />
              <MiniStat label="Available" value={dashboard.conceptsByStatus.fringe.length} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <DashboardLink
          href="/student/curriculum"
          icon={BookOpen}
          label="Curriculum"
          value={`${totalConcepts} concepts`}
        />
        <DashboardLink
          href="/student/activity"
          icon={Activity}
          label="Activity"
          value={`${dashboard.analyticsSnapshot.conceptsStarted} started`}
        />
        <DashboardLink
          href="/student/analytics"
          icon={BarChart3}
          label="Analytics"
          value={formatDuration(dashboard.analyticsSnapshot.averageTimePerConcept)}
        />
        <DashboardLink
          href="/student/reviews"
          icon={RotateCcw}
          label="Review queue"
          value={`${dashboard.conceptsByStatus.reviewNeeded.length} due`}
        />
        <DashboardLink
          href="/student/account"
          icon={Gauge}
          label="Profile"
          value={`Level ${dashboard.profile.currentLevel}`}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-6">
          <ConceptSection
            concepts={nextConcepts}
            description="Review due concepts come first, followed by concepts already in progress and newly available lessons."
            title="Next best actions"
          />
          <ConceptSection
            concepts={dashboard.conceptsByStatus.mastered.slice(0, 3)}
            description="These are ready for challenge attempts or quick confidence checks."
            title="Recently mastered"
          />
        </div>

        <aside className="space-y-6">
          <Panel title="Learning mix" icon={BookOpen}>
            <div className="space-y-3">
              <DistributionRow label="Review due" value={dashboard.conceptsByStatus.reviewNeeded.length} total={totalConcepts} />
              <DistributionRow label="In progress" value={dashboard.conceptsByStatus.inProgress.length} total={totalConcepts} />
              <DistributionRow label="Available" value={dashboard.conceptsByStatus.fringe.length} total={totalConcepts} />
              <DistributionRow label="Mastered" value={dashboard.conceptsByStatus.mastered.length} total={totalConcepts} />
            </div>
          </Panel>

          <Panel title="Concepts to watch" icon={TimerReset}>
            {dashboard.analyticsSnapshot.mostDifficultConcepts.length ? (
              <div className="space-y-3">
                {dashboard.analyticsSnapshot.mostDifficultConcepts.map((concept) => (
                  <Link
                    key={concept.conceptId}
                    className="block rounded-lg border border-outline-variant/50 p-3 transition hover:border-primary/40 hover:bg-muted"
                    href={`/student/concept/${concept.conceptId}`}
                  >
                    <p className="line-clamp-1 text-sm font-bold text-on-surface">{concept.title}</p>
                    <div className="mt-2 flex items-center justify-between text-xs text-on-surface-variant">
                      <span>Practice accuracy</span>
                      <span>{formatPercent(concept.practiceAccuracy)}</span>
                    </div>
                    <MasteryBar className="mt-2" value={concept.practiceAccuracy} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Start a few concepts to build your analytics signal.</p>
            )}
          </Panel>
        </aside>
      </section>
    </div>
  )
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-outline-variant/50 bg-muted p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <p className="mt-2 text-lg font-bold text-on-surface">{value}</p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-background p-3">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="mt-1 font-bold text-on-surface">{value}</p>
    </div>
  )
}

function DashboardLink({
  href,
  icon: Icon,
  label,
  value,
}: {
  href: string
  icon: typeof Activity
  label: string
  value: string
}) {
  return (
    <Link
      className="group rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-4 shadow-sm transition hover:border-primary/40 hover:bg-muted"
      href={href}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
          <Icon className="size-4 text-primary" />
          {label}
        </div>
        <ArrowRight className="size-4 text-on-surface-variant transition group-hover:translate-x-0.5 group-hover:text-primary" />
      </div>
      <p className="mt-3 text-2xl font-extrabold text-on-surface">{value}</p>
    </Link>
  )
}

function ConceptSection({
  concepts,
  description,
  title,
}: {
  concepts: StudentConceptCard[]
  description: string
  title: string
}) {
  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-extrabold text-on-surface">{title}</h2>
          <p className="mt-1 text-sm text-on-surface-variant">{description}</p>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-on-surface-variant">
          {concepts.length} concepts
        </span>
      </div>

      {concepts.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {concepts.map((concept) => (
            <ConceptCard key={concept.conceptId} concept={concept} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-outline-variant p-5 text-sm text-on-surface-variant">
          Nothing urgent right now.
        </div>
      )}
    </section>
  )
}

function Panel({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode
  icon: typeof BookOpen
  title: string
}) {
  return (
    <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Icon className="size-5 text-primary" />
        <h2 className="text-lg font-bold text-on-surface">{title}</h2>
      </div>
      {children}
    </section>
  )
}

function DistributionRow({ label, total, value }: { label: string; total: number; value: number }) {
  const ratio = total ? value / total : 0

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-on-surface-variant">{label}</span>
        <span className="font-semibold text-on-surface">{value}</span>
      </div>
      <MasteryBar className="mt-2" value={ratio} />
    </div>
  )
}
