import { LockKeyhole, Network } from "lucide-react"
import Link from "next/link"

import { requireRole } from "@/lib/auth"
import { getMasteryStatusLabel, getStudentConceptCatalog } from "@/lib/curriculum"

const statusToneClasses: Record<string, string> = {
  LOCKED: "bg-slate-200 text-slate-800",
  FRINGE: "bg-sky-100 text-sky-900",
  IN_PROGRESS: "bg-amber-100 text-amber-900",
  MASTERED: "bg-emerald-100 text-emerald-900",
  REVIEW_NEEDED: "bg-rose-100 text-rose-900",
}

export default async function ConceptsPage() {
  const session = await requireRole("STUDENT")
  const courses = await getStudentConceptCatalog(session.user.id)

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          Concepts
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Knowledge structure</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Your concept map now reflects real curriculum data, prerequisite rules, and the current
          mastery state stored for your profile.
        </p>
      </section>

      {courses.length ? (
        courses.map((course) => (
          <section key={course.id} className="space-y-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
                Course
              </p>
              <h2 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                {course.title}
              </h2>
            </div>

            {course.units.map((unit) => (
              <article key={unit.id} className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                      Unit {unit.order}
                    </p>
                    <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                      {unit.title}
                    </h3>
                  </div>
                  <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
                    <Network className="size-5" />
                  </div>
                </div>

                <div className="mt-8 grid gap-5 xl:grid-cols-2">
                  {unit.concepts.length ? (
                    unit.concepts.map((concept) => (
                      <article key={concept.id} className="rounded-3xl border border-border bg-slate-50 p-6">
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h4 className="text-lg font-semibold text-foreground">{concept.title}</h4>
                            <p className="mt-2 text-sm leading-6 text-muted-foreground">
                              {concept.description ?? "This concept is ready for lesson content authoring."}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                              statusToneClasses[concept.status]
                            }`}
                          >
                            {getMasteryStatusLabel(concept.status)}
                          </span>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                          <MetricCard label="Threshold" value={`${Math.round(concept.unlockThreshold * 100)}%`} />
                          <MetricCard
                            label="Questions"
                            value={String(concept.questionCount)}
                          />
                          <MetricCard
                            label="Baseline"
                            value={
                              concept.masteryProbability !== null
                                ? `${Math.round(concept.masteryProbability * 100)}%`
                                : "None yet"
                            }
                          />
                        </div>

                        <div className="mt-3 grid gap-3 sm:grid-cols-2">
                          <MetricCard
                            label="Effective"
                            value={
                              concept.effectiveMastery !== null
                                ? `${Math.round(concept.effectiveMastery * 100)}%`
                                : "None yet"
                            }
                          />
                          <MetricCard
                            label="Next review"
                            value={concept.nextReviewAt ? formatDate(concept.nextReviewAt) : "Not scheduled"}
                          />
                        </div>

                        {concept.unlocked ? (
                          <div className="mt-6 space-y-4">
                            <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
                              This concept is available in your current progression fringe.
                            </p>
                            <div className="flex flex-wrap gap-3">
                              <Link
                                href={`/learn/${concept.id}`}
                                className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                              >
                                Open Workspace
                              </Link>
                            </div>
                          </div>
                        ) : (
                          <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-4 text-sm text-amber-950">
                            <div className="flex items-start gap-3">
                              <LockKeyhole className="mt-0.5 size-4 shrink-0" />
                              <div>
                                <p className="font-semibold">Locked until prerequisite mastery improves</p>
                                <ul className="mt-2 space-y-1 text-amber-900">
                                  {concept.unmetPrerequisites.map((prerequisite) => (
                                    <li key={prerequisite.conceptId}>
                                      {prerequisite.title}: {Math.round(prerequisite.currentMastery * 100)}%
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        )}
                      </article>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-border bg-slate-50 px-5 py-6 text-sm text-muted-foreground">
                      No concepts have been authored for this unit yet.
                    </div>
                  )}
                </div>
              </article>
            ))}
          </section>
        ))
      ) : (
        <div className="rounded-[2rem] border border-dashed border-border bg-white px-6 py-10 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">No curriculum published yet</h2>
          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            The student catalog will populate here once a course writer or admin creates the first math
            curriculum slice in the CMS.
          </p>
        </div>
      )}
    </div>
  )
}

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
})

function formatDate(value: Date) {
  return dateFormatter.format(value)
}

function MetricCard({
  label,
  value,
}: {
  label: string
  value: string
}) {
  return (
    <div className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">{label}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{value}</p>
    </div>
  )
}
