import Link from "next/link"
import { ArrowRight, Clock3 } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { getReviewQueue } from "@/lib/assessment"

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

export default async function ReviewPage() {
  const session = await requireRole("STUDENT")
  const reviewQueue = await getReviewQueue(session.user.id)

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">Review</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          Retention queue
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Concepts appear here when their scheduled review time has passed. The effective mastery
          you see below is the decayed estimate that drives spaced reinforcement in Phase 3.
        </p>
      </section>

      {reviewQueue.length ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {reviewQueue.map((item) => (
            <article key={item.conceptId} className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                    {item.courseTitle} / {item.unitTitle}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">{item.title}</h2>
                </div>
                <div className="rounded-2xl bg-amber-50 p-3 text-amber-900">
                  <Clock3 className="size-5" />
                </div>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <ReviewStat label="Baseline" value={`${Math.round(item.baselineMastery * 100)}%`} />
                <ReviewStat label="Effective" value={`${Math.round(item.effectiveMastery * 100)}%`} />
                <ReviewStat label="Due since" value={dateTimeFormatter.format(item.nextReviewAt)} />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/learn/${item.conceptId}`}
                  className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  Open Review Session
                  <ArrowRight className="size-4" />
                </Link>
                <Link
                  href="/concepts"
                  className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm font-semibold text-foreground transition hover:bg-secondary"
                >
                  View Concept Map
                </Link>
              </div>
            </article>
          ))}
        </section>
      ) : (
        <section className="rounded-[2rem] border border-dashed border-border bg-white px-6 py-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">No reviews are due right now</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            As concepts age past their computed review time, they will be surfaced here automatically.
          </p>
          <Link
            href="/learn"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Continue Learning
            <ArrowRight className="size-4" />
          </Link>
        </section>
      )}
    </div>
  )
}

function ReviewStat({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-4">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}
