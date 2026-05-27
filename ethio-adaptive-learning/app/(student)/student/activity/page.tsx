import Link from "next/link"
import {
  Activity,
  CheckCircle2,
  Clock3,
  Flame,
  HelpCircle,
  Target,
  XCircle,
} from "lucide-react"

import { MasteryBar, formatDate, formatDuration } from "@/components/student/student-status"
import { requireRole } from "@/lib/auth-server"
import { getStudentActivity } from "@/lib/student/data"

export default async function ActivityPage() {
  const session = await requireRole("STUDENT")
  const activity = await getStudentActivity(session.user.id)
  const answered = activity.summary.correctCount + activity.summary.incorrectCount
  const accuracy = answered ? activity.summary.correctCount / answered : 0

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
        <p className="text-sm font-semibold text-primary">Activity</p>
        <h1 className="mt-2 text-3xl font-extrabold text-on-surface">Your learning trail</h1>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
          A recent record of practice, checkpoint, exam, content, and tutor activity.
        </p>
        <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Metric icon={Activity} label="30-day activity" value={activity.summary.totalActivities.toLocaleString()} />
          <Metric icon={Flame} label="Active days" value={`${activity.summary.activeDays30} days`} />
          <Metric icon={Target} label="Answered accuracy" value={`${Math.round(accuracy * 100)}%`} />
          <Metric icon={HelpCircle} label="Tutor hints" value={activity.summary.hintCount.toLocaleString()} />
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Clock3 className="size-5 text-primary" />
            <h2 className="text-lg font-bold text-on-surface">Timeline</h2>
          </div>

          {activity.timeline.length ? (
            <div className="space-y-3">
              {activity.timeline.map((item) => (
                <Link
                  key={item.id}
                  className="grid gap-3 rounded-lg border border-outline-variant/50 p-4 transition hover:border-primary/40 hover:bg-muted sm:grid-cols-[1fr_auto]"
                  href={`/student/concept/${item.conceptId}`}
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <ResultIcon value={item.isCorrect} />
                      <p className="text-sm font-bold text-on-surface">{item.label}</p>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-on-surface-variant">{item.conceptTitle}</p>
                    <p className="mt-1 text-xs text-on-surface-variant">
                      {item.courseTitle} / {item.unitTitle}
                    </p>
                  </div>
                  <div className="text-left text-xs text-on-surface-variant sm:text-right">
                    <p>{formatDate(item.timestamp)}</p>
                    {item.responseTimeMs ? <p className="mt-1">{formatDuration(item.responseTimeMs)}</p> : null}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-outline-variant p-5 text-sm text-on-surface-variant">
              Activity appears here after you read content, practice, use hints, or take exams.
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <Panel title="Activity mix">
            <ActivityRow label="Practice" value={activity.summary.practiceCount} total={activity.summary.totalActivities} />
            <ActivityRow label="Checkpoint" value={activity.summary.checkpointCount} total={activity.summary.totalActivities} />
            <ActivityRow label="Exam responses" value={activity.summary.examResponseCount} total={activity.summary.totalActivities} />
            <ActivityRow label="Content reads" value={activity.summary.contentReadCount} total={activity.summary.totalActivities} />
          </Panel>

          <Panel title="Recent exams">
            {activity.recentExams.length ? (
              <div className="space-y-3">
                {activity.recentExams.map((exam) => (
                  <Link
                    key={exam.id}
                    className="block rounded-lg border border-outline-variant/50 p-3 transition hover:border-primary/40 hover:bg-muted"
                    href={`/student/concept/${exam.conceptId}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="line-clamp-1 text-sm font-bold text-on-surface">{exam.conceptTitle}</p>
                      <span className="rounded-md bg-muted px-2 py-1 text-[11px] font-semibold text-on-surface-variant">
                        {exam.pathway}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-on-surface-variant">
                      {exam.score == null ? "Score unavailable" : `${Math.round(exam.score * 100)}% score`} /{" "}
                      {exam.questionCount} questions
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant">Completed exams will appear here.</p>
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
  icon: typeof Activity
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-outline-variant/50 bg-muted p-4">
      <div className="flex items-center gap-2 text-sm font-semibold text-on-surface-variant">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-extrabold text-on-surface">{value}</p>
    </div>
  )
}

function Panel({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
      <h2 className="mb-4 text-lg font-bold text-on-surface">{title}</h2>
      <div className="space-y-3">{children}</div>
    </section>
  )
}

function ActivityRow({ label, total, value }: { label: string; total: number; value: number }) {
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

function ResultIcon({ value }: { value: boolean | null }) {
  if (value === true) {
    return <CheckCircle2 className="size-4 text-secondary" />
  }

  if (value === false) {
    return <XCircle className="size-4 text-error-rose" />
  }

  return <Activity className="size-4 text-primary" />
}
