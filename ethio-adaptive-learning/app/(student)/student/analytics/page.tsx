import Link from "next/link"
import {
  BarChart3,
  BookOpen,
  Clock3,
  Flame,
  Gauge,
  Target,
  TimerReset,
} from "lucide-react"

import {
  MasteryBar,
  StatusBadge,
  formatDuration,
  formatPercent,
} from "@/components/student/student-status"
import { requireRole } from "@/lib/auth-server"
import { getStudentAnalytics } from "@/lib/student/data"

export default async function AnalyticsPage() {
  const session = await requireRole("STUDENT")
  const analytics = await getStudentAnalytics(session.user.id)

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-sm font-semibold text-primary">Analytics</p>
            <h1 className="mt-2 text-3xl font-extrabold text-on-surface">Mastery signal</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
              Track mastery, assessment accuracy, pacing, and where your next study time will matter most.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Metric icon={Gauge} label="Level" value={String(analytics.profile.currentLevel)} />
              <Metric icon={Flame} label="Streak" value={`${analytics.profile.dailyStreak} days`} />
              <Metric icon={Target} label="Total XP" value={analytics.profile.totalXP.toLocaleString()} />
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant/50 bg-muted p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-on-surface">Overall mastery</p>
              <p className="text-2xl font-extrabold text-primary">{formatPercent(analytics.progress.overallProgress)}</p>
            </div>
            <MasteryBar className="mt-4" value={analytics.progress.overallProgress} />
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <MiniStat label="Mastered" value={analytics.progress.masteredConcepts} />
              <MiniStat label="Unlocked" value={analytics.progress.unlockedConcepts} />
              <MiniStat label="Review due" value={analytics.progress.reviewDue} />
              <MiniStat label="Total" value={analytics.progress.totalConcepts} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <Metric
          icon={BookOpen}
          label="Concepts started"
          value={analytics.performance.conceptsStarted.toLocaleString()}
        />
        <Metric
          icon={BarChart3}
          label="Practice accuracy"
          value={formatPercent(analytics.performance.averagePracticeAccuracy)}
        />
        <Metric
          icon={Target}
          label="Checkpoint pass rate"
          value={formatPercent(analytics.performance.averageCheckpointPassRate)}
        />
        <Metric
          icon={TimerReset}
          label="Avg time/question"
          value={formatDuration(analytics.performance.averageTimePerQuestion)}
        />
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <Panel title="Course progress" icon={BookOpen}>
            {analytics.courseProgress.length ? (
              <div className="space-y-4">
                {analytics.courseProgress.map((course) => (
                  <div key={course.courseId} className="rounded-lg border border-outline-variant/50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <p className="font-bold text-on-surface">{course.courseTitle}</p>
                      <span className="text-sm font-semibold text-on-surface-variant">
                        {course.masteredConcepts}/{course.totalConcepts} mastered
                      </span>
                    </div>
                    <MasteryBar className="mt-3" value={course.averageMastery} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Course analytics appear after published concepts are available.</p>
            )}
          </Panel>

          <Panel title="Strongest concepts" icon={Gauge}>
            {analytics.strongestConcepts.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {analytics.strongestConcepts.map((concept) => (
                  <ConceptSignal key={concept.conceptId} concept={concept} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Complete a few assessments to build this list.</p>
            )}
          </Panel>
        </div>

        <aside className="space-y-6">
          <Panel title="Status distribution" icon={BarChart3}>
            <div className="space-y-3">
              {analytics.statusDistribution.map((item) => (
                <div key={item.status}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <StatusBadge status={item.status} />
                    <span className="font-semibold text-on-surface">{item.count}</span>
                  </div>
                  <MasteryBar className="mt-2" value={item.percentage} />
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Needs attention" icon={Clock3}>
            {analytics.mostDifficultConcepts.length ? (
              <div className="space-y-3">
                {analytics.mostDifficultConcepts.map((concept) => (
                  <ConceptSignal key={concept.conceptId} concept={concept} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">No difficult concepts detected yet.</p>
            )}
          </Panel>
        </aside>
      </section>
    </div>
  )
}

function Metric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge
  label: string
  value: string
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

function MiniStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-background p-3">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="mt-1 font-bold text-on-surface">{value}</p>
    </div>
  )
}

function Panel({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode
  icon: typeof BarChart3
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

function ConceptSignal({
  concept,
}: {
  concept: {
    conceptId: string
    title: string
    unit: {
      title: string
    }
    pMastery: number
    practiceAccuracy: number
  }
}) {
  return (
    <Link
      className="block rounded-lg border border-outline-variant/50 p-3 transition hover:border-primary/40 hover:bg-muted"
      href={`/student/concept/${concept.conceptId}`}
    >
      <p className="line-clamp-1 text-sm font-bold text-on-surface">{concept.title}</p>
      <p className="mt-1 text-xs text-on-surface-variant">{concept.unit.title}</p>
      <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
        <span>Mastery</span>
        <span>{formatPercent(concept.pMastery)}</span>
      </div>
      <MasteryBar className="mt-2" value={concept.pMastery} />
    </Link>
  )
}
