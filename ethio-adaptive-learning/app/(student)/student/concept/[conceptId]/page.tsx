import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowRight,
  BookOpen,
  BrainCircuit,
  CheckCircle2,
  Clock3,
  LockKeyhole,
  Route,
  Target,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  MasteryBar,
  ReviewAlert,
  StatusBadge,
  formatDate,
  formatDuration,
  formatPercent,
} from "@/components/student/student-status"
import { requireRole } from "@/lib/auth-server"
import { getStudentConceptDetail } from "@/lib/student/data"

type ConceptPageProps = {
  params: Promise<{
    conceptId: string
  }>
}

export default async function StudentConceptPage({ params }: ConceptPageProps) {
  const session = await requireRole("STUDENT")
  const { conceptId } = await params
  const concept = await getStudentConceptDetail(session.user.id, conceptId)

  if (!concept) {
    notFound()
  }

  const locked = concept.status === "LOCKED"

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <nav className="text-sm text-on-surface-variant flex items-center gap-2">
        <Link className="hover:text-primary transition font-medium" href="/student">
          Dashboard
        </Link>
        <span className="opacity-40">/</span>
        <Link className="hover:text-primary transition font-medium" href="/student/curriculum">
          Curriculum
        </Link>
        <span className="opacity-40">/</span>
        <span className="font-bold text-on-surface">{concept.title}</span>
      </nav>

      <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={concept.status} />
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-on-surface-variant">
                {concept.practiceQuestionCount} practice questions
              </span>
            </div>
            <h1 className="mt-4 text-3xl font-extrabold text-on-surface">{concept.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
              {concept.description ?? "Choose guided learning or go straight to the challenge exam."}
            </p>

            <div className="mt-6 flex flex-wrap gap-2">
              {locked ? (
                <Button disabled>
                  <BookOpen className="size-4" />
                  Learn path
                </Button>
              ) : (
                <Button asChild>
                  <Link href={`/student/concept/${concept.conceptId}/learn`}>
                    <BookOpen className="size-4" />
                    Learn path
                  </Link>
                </Button>
              )}
              {locked ? (
                <Button disabled variant="outline">
                  <Target className="size-4" />
                  Challenge exam
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href={`/student/concept/${concept.conceptId}/challenge`}>
                    <Target className="size-4" />
                    Challenge exam
                  </Link>
                </Button>
              )}
              {concept.status === "REVIEW_NEEDED" ? (
                <Button asChild variant="secondary">
                  <Link href={`/student/concept/${concept.conceptId}/review`}>
                    Review now
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
              ) : null}
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant/50 bg-muted p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-on-surface">Mastery probability</p>
              <p className="text-2xl font-extrabold text-primary">{formatPercent(concept.pMastery)}</p>
            </div>
            <MasteryBar className="mt-4" value={concept.pMastery} />
            <div className="mt-4 space-y-2 text-sm text-on-surface-variant">
              <p>Last assessed: {formatDate(concept.lastAssessedAt)}</p>
              <p>Next review: {formatDate(concept.nextReviewAt)}</p>
            </div>
            {concept.status === "REVIEW_NEEDED" ? <ReviewAlert className="mt-4" /> : null}
          </div>
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="space-y-6">
          <Panel title="Recommendation" icon={BrainCircuit}>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="flex items-start gap-3 rounded-lg bg-primary-fixed/50 p-4">
                <Route className="mt-1 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-bold text-on-surface">Learn path</p>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    Read the content, practice, pass the checkpoint, then take the mastery exam.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-lg border border-outline-variant/50 p-4">
                <Target className="mt-1 size-5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-bold text-on-surface">Challenge path</p>
                  <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                    Start the exam directly. No checkpoint is required on this path.
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-lg bg-muted p-4">
              <BrainCircuit className="mt-1 size-5 shrink-0 text-primary" />
              <div>
                <p className="text-sm font-bold capitalize text-on-surface">
                  {concept.recommendation.type} pathway recommended
                </p>
                <p className="mt-1 text-sm leading-6 text-on-surface-variant">
                  {concept.recommendation.rationale}
                </p>
              </div>
            </div>
            {locked ? (
              <div className="mt-4 flex flex-col gap-3 rounded-lg border border-outline-variant/50 bg-muted/20 p-4 text-sm">
                <div className="flex items-start gap-3 text-on-surface-variant font-medium">
                   <LockKeyhole className="mt-0.5 size-4 shrink-0" />
                   <span>The following prerequisites must be mastered to unlock this concept:</span>
                </div>
                <div className="flex flex-wrap gap-2 pl-7">
                  {concept.unmetPrerequisites.map((p) => (
                    <Link
                      key={p.conceptId}
                      href={`/student/concept/${p.conceptId}`}
                      className="rounded-md bg-outline-variant/30 px-2.5 py-1 text-xs font-bold text-on-surface hover:bg-outline-variant/50 transition"
                    >
                      {p.title}
                    </Link>
                  ))}
                </div>
              </div>
            ) : null}
          </Panel>

          <Panel title="Prerequisites" icon={CheckCircle2}>
            {concept.prerequisiteConcepts.length ? (
              <div className="grid gap-3 md:grid-cols-2">
                {concept.prerequisiteConcepts.map((prerequisite) => (
                  <Link
                    key={prerequisite.id}
                    href={`/student/concept/${prerequisite.id}`}
                    className="group rounded-lg border border-outline-variant/50 p-3 transition hover:border-primary/40 hover:bg-muted/30"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-semibold text-on-surface group-hover:text-primary">
                        {prerequisite.title}
                      </p>
                      <StatusBadge status={prerequisite.status} />
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-on-surface-variant">
                      <span>Mastery</span>
                      <span>{formatPercent(prerequisite.pMastery)}</span>
                    </div>
                    <MasteryBar className="mt-2" value={prerequisite.pMastery} />
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">No prerequisites block this concept.</p>
            )}
          </Panel>
        </section>

        <aside className="space-y-6">
          <Panel title="Analytics snapshot" icon={Clock3}>
            <div className="grid gap-3">
              <Stat label="Total attempts" value={concept.analyticsSnapshot.totalAttempts} />
              <Stat label="Checkpoint pass rate" value={formatPercent(concept.analyticsSnapshot.checkpointPassRate)} />
              <Stat label="Practice accuracy" value={formatPercent(concept.analyticsSnapshot.practiceAccuracy)} />
              <Stat
                label="Avg time/question"
                value={formatDuration(concept.analyticsSnapshot.averageTimePerQuestion)}
              />
            </div>
          </Panel>

          <Panel title="Recent activity" icon={Clock3}>
            {concept.analyticsSnapshot.recentActivityFeed.length ? (
              <div className="space-y-3">
                {concept.analyticsSnapshot.recentActivityFeed.map((activity) => (
                  <div
                    key={activity.id}
                    className="rounded-lg border border-outline-variant/50 p-3 text-sm"
                  >
                    <p className="font-semibold text-on-surface">{activity.activityType.replaceAll("_", " ")}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">{formatDate(activity.timestamp)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">No recent interactions yet.</p>
            )}
          </Panel>
        </aside>
      </div>
    </div>
  )
}

function Panel({
  children,
  icon: Icon,
  title,
}: {
  children: React.ReactNode
  icon: typeof BrainCircuit
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

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-muted p-3">
      <span className="text-sm text-on-surface-variant">{label}</span>
      <span className="text-sm font-bold text-on-surface">{value}</span>
    </div>
  )
}
