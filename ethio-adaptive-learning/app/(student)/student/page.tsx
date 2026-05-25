import { Activity, BookOpen, Flame, Gauge, Target, TimerReset } from "lucide-react"

import { ConceptCard } from "@/components/student/concept-card"
import {
  MasteryBar,
  formatDuration,
  formatPercent,
} from "@/components/student/student-status"
import { requireRole } from "@/lib/auth"
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

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[1.35fr_0.65fr]">
          <div>
            <p className="text-sm font-semibold text-primary">Learning dashboard</p>
            <h1 className="mt-2 text-3xl font-extrabold text-on-surface">Your adaptive path</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-on-surface-variant">
              Continue available concepts, refresh due mastery, or take a challenge when the
              recommendation engine says you are ready.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <SummaryMetric icon={Gauge} label="Level" value={String(dashboard.profile.currentLevel)} />
              <SummaryMetric icon={Target} label="Total XP" value={String(dashboard.profile.totalXP)} />
              <SummaryMetric icon={Flame} label="Daily streak" value={`${dashboard.profile.dailyStreak} days`} />
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant/50 bg-muted p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-on-surface">Overall progress</p>
              <p className="text-2xl font-extrabold text-primary">{formatPercent(progressValue)}</p>
            </div>
            <MasteryBar className="mt-4" value={progressValue} />
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <div className="rounded-md bg-background p-3">
                <p className="text-xs text-on-surface-variant">Mastered</p>
                <p className="mt-1 font-bold text-on-surface">{dashboard.analyticsSnapshot.conceptsMastered}</p>
              </div>
              <div className="rounded-md bg-background p-3">
                <p className="text-xs text-on-surface-variant">Started</p>
                <p className="mt-1 font-bold text-on-surface">{dashboard.analyticsSnapshot.conceptsStarted}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="analytics" className="grid gap-4 lg:grid-cols-4">
        <AnalyticsMetric icon={BookOpen} label="Concepts mastered" value={dashboard.analyticsSnapshot.conceptsMastered} />
        <AnalyticsMetric icon={Activity} label="Concepts started" value={dashboard.analyticsSnapshot.conceptsStarted} />
        <AnalyticsMetric icon={Flame} label="Current streak" value={dashboard.analyticsSnapshot.currentStreak} />
        <AnalyticsMetric
          icon={TimerReset}
          label="Avg time/question"
          value={formatDuration(dashboard.analyticsSnapshot.averageTimePerConcept)}
        />
      </section>

      <section id="curriculum" className="space-y-6">
        <ConceptSection
          concepts={dashboard.conceptsByStatus.reviewNeeded}
          description="Mastery has likely decayed. Refresh these before they become expensive to relearn."
          title="Review Needed"
        />
        <ConceptSection
          concepts={dashboard.conceptsByStatus.inProgress}
          description="You have started these concepts and can continue from the active learning path."
          title="In Progress"
        />
        <ConceptSection
          concepts={dashboard.conceptsByStatus.fringe}
          description="Prerequisites are met, so these concepts are ready when you choose to begin."
          title="Available Concepts"
        />
        <ConceptSection
          concepts={dashboard.conceptsByStatus.mastered}
          description="Completed concepts remain available for challenge attempts and quick confidence checks."
          title="Mastered"
        />
        <ConceptSection
          concepts={dashboard.conceptsByStatus.locked}
          description="Prerequisites are still in progress. These unlock automatically when mastery is high enough."
          title="Locked Concepts"
        />
      </section>

      {dashboard.analyticsSnapshot.mostDifficultConcepts.length ? (
        <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5">
          <h2 className="text-lg font-bold text-on-surface">Concepts to watch</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            {dashboard.analyticsSnapshot.mostDifficultConcepts.map((concept) => (
              <div key={concept.conceptId} className="rounded-lg border border-outline-variant/50 bg-muted p-4">
                <p className="text-sm font-bold text-on-surface">{concept.title}</p>
                <p className="mt-1 text-xs text-on-surface-variant">{concept.unit.title}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span>Practice accuracy</span>
                  <span className="font-semibold">{formatPercent(concept.practiceAccuracy)}</span>
                </div>
                <MasteryBar className="mt-2" value={concept.practiceAccuracy} />
              </div>
            ))}
          </div>
        </section>
      ) : null}
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

function AnalyticsMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen
  label: string
  value: number | string
}) {
  return (
    <div className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-extrabold text-on-surface">{value}</p>
    </div>
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
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {concepts.map((concept) => (
            <ConceptCard key={concept.conceptId} concept={concept} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-outline-variant p-5 text-sm text-on-surface-variant">
          Nothing here right now.
        </div>
      )}
    </section>
  )
}
