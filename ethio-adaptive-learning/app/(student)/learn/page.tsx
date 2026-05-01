import Link from "next/link"
import { ArrowRight, BookOpenCheck, BrainCircuit, Clock3 } from "lucide-react"

import { getConceptRecommendation as deriveRecommendation } from "@/lib/adaptive/difficulty"
import { requireRole } from "@/lib/auth"
import { getReviewQueue } from "@/lib/assessment"
import { getMasteryStatusLabel, getStudentConceptCatalog } from "@/lib/curriculum"

export default async function LearnPage() {
  const session = await requireRole("STUDENT")
  const [courses, reviewQueue] = await Promise.all([
    getStudentConceptCatalog(session.user.id),
    getReviewQueue(session.user.id),
  ])

  const unlockedConcepts = courses.flatMap((course) =>
    course.units.flatMap((unit) =>
      unit.concepts
        .filter((concept) => concept.unlocked)
        .map((concept) => ({
          ...concept,
          courseTitle: course.title,
          unitTitle: unit.title,
          recommendation: deriveRecommendation(concept.effectiveMastery ?? concept.masteryProbability ?? 0.15),
        }))
    )
  )

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">Learn</p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
          Adaptive learning workspace
        </h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Pick up an unlocked concept, follow the guided Learn path, or jump straight into a
          challenge exam when your current mastery makes that a sensible bet.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <MetricCard icon={<BookOpenCheck className="size-5" />} label="Unlocked concepts" value={String(unlockedConcepts.length)} />
          <MetricCard icon={<Clock3 className="size-5" />} label="Reviews due" value={String(reviewQueue.length)} />
          <MetricCard
            icon={<BrainCircuit className="size-5" />}
            label="Challenge ready"
            value={String(
              unlockedConcepts.filter((concept) => concept.recommendation === "CHALLENGE_RECOMMENDED").length
            )}
          />
        </div>
      </section>

      {reviewQueue.length ? (
        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-amber-700">
                Review queue
              </p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-amber-950">
                {reviewQueue.length} concept{reviewQueue.length === 1 ? "" : "s"} need reinforcement
              </h2>
            </div>
            <Link
              href="/review"
              className="inline-flex items-center gap-2 rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-950"
            >
              Open Review Queue
              <ArrowRight className="size-4" />
            </Link>
          </div>
        </section>
      ) : null}

      {unlockedConcepts.length ? (
        <section className="grid gap-5 xl:grid-cols-2">
          {unlockedConcepts.map((concept) => (
            <article key={concept.id} className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                    {concept.courseTitle} / {concept.unitTitle}
                  </p>
                  <h2 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                    {concept.title}
                  </h2>
                  <p className="mt-3 text-sm leading-6 text-muted-foreground">
                    {concept.description ?? "Lesson content is ready for guided study in this workspace."}
                  </p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
                  {getMasteryStatusLabel(concept.status)}
                </span>
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <DataPoint
                  label="Baseline"
                  value={concept.masteryProbability != null ? `${Math.round(concept.masteryProbability * 100)}%` : "15%"}
                />
                <DataPoint
                  label="Effective"
                  value={concept.effectiveMastery != null ? `${Math.round(concept.effectiveMastery * 100)}%` : "15%"}
                />
                <DataPoint
                  label="Recommendation"
                  value={concept.recommendation === "CHALLENGE_RECOMMENDED" ? "Challenge" : "Learn"}
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href={`/learn/${concept.id}`}
                  className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                >
                  Open Workspace
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
          <h2 className="text-xl font-semibold text-foreground">No concepts are unlocked yet</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Build your path from the concept map first. As prerequisite mastery improves, new
            concepts will appear here automatically.
          </p>
          <Link
            href="/concepts"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
          >
            Go To Concepts
            <ArrowRight className="size-4" />
          </Link>
        </section>
      )}
    </div>
  )
}

function MetricCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="rounded-3xl bg-secondary p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="text-teal-700">{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function DataPoint({
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
