import type { ReactNode } from "react"
import { BookOpenText, Network, PencilRuler, PlusCircle } from "lucide-react"

import {
  deleteConceptAction,
  deleteCourseAction,
  deleteUnitAction,
  saveConceptAction,
  saveCourseAction,
  saveUnitAction,
  toggleCourseArchiveAction,
} from "./actions"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth"
import { getCurriculumCmsData } from "@/lib/curriculum"

const PAGE_PATH = "/admin/cms/concepts"
const inputClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-600"
const textareaClassName = `${inputClassName} min-h-28 resize-y`
const selectClassName = inputClassName

type ConceptsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type CmsData = Awaited<ReturnType<typeof getCurriculumCmsData>>
type CourseRecord = CmsData["courses"][number]
type AuthorRecord = CmsData["authors"][number]

export default async function AdminConceptsPage({ searchParams }: ConceptsPageProps) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const params = (await searchParams) ?? {}
  const status = getSingleValue(params.status)
  const error = getSingleValue(params.error)
  const { authors, activeCourses, archivedCourses } = await getCurriculumCmsData()

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          Curriculum CMS
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Math curriculum authoring</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Build the course tree, define concept prerequisites, and tune baseline mastery parameters
          from one server-rendered workspace.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Active courses" value={activeCourses.length} icon={<BookOpenText className="size-5" />} />
          <StatCard
            label="Units"
            value={activeCourses.reduce((total, course) => total + course.units.length, 0)}
            icon={<PencilRuler className="size-5" />}
          />
          <StatCard
            label="Concepts"
            value={activeCourses.reduce(
              (total, course) =>
                total + course.units.reduce((unitTotal, unit) => unitTotal + unit.concepts.length, 0),
              0
            )}
            icon={<Network className="size-5" />}
          />
        </div>
      </section>

      {status ? <FeedbackBanner tone="success" message={status} /> : null}
      {error ? <FeedbackBanner tone="error" message={error} /> : null}

      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
            <PlusCircle className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Create a new course</h2>
            <p className="text-sm text-muted-foreground">
              Start the next curriculum branch and assign an admin or course writer to own it.
            </p>
          </div>
        </div>

        <form action={saveCourseAction} className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <input name="returnTo" type="hidden" value={PAGE_PATH} />

          <label className="block text-sm font-medium text-foreground">
            Course title
            <input className={inputClassName} defaultValue="" name="title" placeholder="Grade 12 Mathematics" />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Author
            <select className={selectClassName} defaultValue="" name="authorId">
              <option value="">Unassigned</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.username} ({author.role.replace("_", " ")})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-foreground lg:col-span-2">
            Description
            <textarea
              className={textareaClassName}
              defaultValue=""
              name="description"
              placeholder="A coherent Grade 12 mathematics course for adaptive study and exam preparation."
              rows={4}
            />
          </label>

          <div className="lg:col-span-2">
            <Button type="submit">Create course</Button>
          </div>
        </form>
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Active curriculum</h2>
            <p className="text-sm text-muted-foreground">
              Courses, units, and concept nodes are ordered exactly as learners will experience them.
            </p>
          </div>
        </div>

        {activeCourses.length ? (
          activeCourses.map((course) => (
            <CourseEditor key={course.id} authors={authors} course={course} />
          ))
        ) : (
          <EmptyState
            title="No active courses yet"
            description="Create your first Grade 12 Mathematics course to start building units and concept prerequisites."
          />
        )}
      </section>

      {archivedCourses.length ? (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Archived courses</h2>
            <p className="text-sm text-muted-foreground">
              Archived courses stay out of the student catalog but can still be restored or deleted.
            </p>
          </div>

          {archivedCourses.map((course) => (
            <CourseEditor key={course.id} authors={authors} course={course} />
          ))}
        </section>
      ) : null}
    </div>
  )
}

function CourseEditor({
  course,
  authors,
}: {
  course: CourseRecord
  authors: AuthorRecord[]
}) {
  const courseConceptOptions = course.units.flatMap((unit) =>
    unit.concepts.map((concept) => ({
      id: concept.id,
      title: concept.title,
      unitTitle: unit.title,
    }))
  )

  return (
    <article className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h3 className="text-2xl font-semibold tracking-tight text-foreground">{course.title}</h3>
            {course.archivedAt ? (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-amber-900">
                Archived
              </span>
            ) : null}
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {course.units.length} units,{" "}
            {course.units.reduce((total, unit) => total + unit.concepts.length, 0)} concepts
          </p>
        </div>
      </div>

      <form action={saveCourseAction} className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <input name="returnTo" type="hidden" value={PAGE_PATH} />
        <input name="courseId" type="hidden" value={course.id} />

        <label className="block text-sm font-medium text-foreground">
          Course title
          <input className={inputClassName} defaultValue={course.title} name="title" />
        </label>

        <label className="block text-sm font-medium text-foreground">
          Author
          <select className={selectClassName} defaultValue={course.authorId ?? ""} name="authorId">
            <option value="">Unassigned</option>
            {authors.map((author) => (
              <option key={author.id} value={author.id}>
                {author.username} ({author.role.replace("_", " ")})
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-foreground lg:col-span-2">
          Description
          <textarea
            className={textareaClassName}
            defaultValue={course.description ?? ""}
            name="description"
            rows={3}
          />
        </label>

        <div className="flex flex-wrap gap-3 lg:col-span-2">
          <Button type="submit">Save course</Button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap gap-3">
        <form action={toggleCourseArchiveAction}>
          <input name="returnTo" type="hidden" value={PAGE_PATH} />
          <input name="courseId" type="hidden" value={course.id} />
          <input name="archived" type="hidden" value={course.archivedAt ? "true" : "false"} />
          <Button type="submit" variant="outline">
            {course.archivedAt ? "Restore course" : "Archive course"}
          </Button>
        </form>

        <form action={deleteCourseAction}>
          <input name="returnTo" type="hidden" value={PAGE_PATH} />
          <input name="courseId" type="hidden" value={course.id} />
          <Button type="submit" variant="destructive">
            Delete course
          </Button>
        </form>
      </div>

      <section className="mt-8 rounded-3xl bg-secondary/50 p-6">
        <h4 className="text-lg font-semibold text-foreground">Create unit</h4>
        <form action={saveUnitAction} className="mt-4 grid gap-4 md:grid-cols-[1fr_180px_auto]">
          <input name="returnTo" type="hidden" value={PAGE_PATH} />
          <input name="courseId" type="hidden" value={course.id} />

          <label className="block text-sm font-medium text-foreground">
            Unit title
            <input className={inputClassName} defaultValue="" name="title" placeholder="Functions and Graphs" />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Display order
            <input className={inputClassName} defaultValue={course.units.length + 1} min={1} name="order" type="number" />
          </label>

          <div className="flex items-end">
            <Button type="submit">Add unit</Button>
          </div>
        </form>
      </section>

      <div className="mt-8 space-y-6">
        {course.units.length ? (
          course.units.map((unit) => (
            <section key={unit.id} className="rounded-3xl border border-border bg-slate-50 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                    Unit {unit.order}
                  </p>
                  <h4 className="mt-2 text-xl font-semibold text-foreground">{unit.title}</h4>
                </div>
              </div>

              <form action={saveUnitAction} className="mt-6 grid gap-4 md:grid-cols-[1fr_180px_auto]">
                <input name="returnTo" type="hidden" value={PAGE_PATH} />
                <input name="unitId" type="hidden" value={unit.id} />
                <input name="courseId" type="hidden" value={course.id} />

                <label className="block text-sm font-medium text-foreground">
                  Unit title
                  <input className={inputClassName} defaultValue={unit.title} name="title" />
                </label>

                <label className="block text-sm font-medium text-foreground">
                  Display order
                  <input className={inputClassName} defaultValue={unit.order} min={1} name="order" type="number" />
                </label>

                <div className="flex items-end gap-3">
                  <Button type="submit">Save unit</Button>
                </div>
              </form>

              <form action={deleteUnitAction} className="mt-4">
                <input name="returnTo" type="hidden" value={PAGE_PATH} />
                <input name="unitId" type="hidden" value={unit.id} />
                <Button type="submit" variant="destructive">
                  Delete unit
                </Button>
              </form>

              <section className="mt-8 rounded-3xl bg-white p-6">
                <h5 className="text-lg font-semibold text-foreground">Create concept</h5>
                <p className="mt-2 text-sm text-muted-foreground">
                  Define the lesson body, tuning defaults, and prerequisite concepts that unlock this node.
                </p>

                <ConceptForm
                  courseConceptOptions={courseConceptOptions}
                  submitLabel="Create concept"
                  unitId={unit.id}
                />
              </section>

              <div className="mt-8 space-y-6">
                {unit.concepts.length ? (
                  unit.concepts.map((concept) => (
                    <section key={concept.id} className="rounded-3xl border border-border bg-white p-6">
                      <div className="flex flex-wrap items-start justify-between gap-4">
                        <div>
                          <h5 className="text-lg font-semibold text-foreground">{concept.title}</h5>
                          <p className="mt-2 text-sm text-muted-foreground">
                            {concept.questions.length} questions linked
                          </p>
                        </div>
                      </div>

                      <ConceptForm
                        concept={concept}
                        courseConceptOptions={courseConceptOptions}
                        submitLabel="Save concept"
                        unitId={unit.id}
                      />

                      <form action={deleteConceptAction} className="mt-4">
                        <input name="returnTo" type="hidden" value={PAGE_PATH} />
                        <input name="conceptId" type="hidden" value={concept.id} />
                        <Button type="submit" variant="destructive">
                          Delete concept
                        </Button>
                      </form>
                    </section>
                  ))
                ) : (
                  <p className="rounded-3xl border border-dashed border-border bg-white px-5 py-6 text-sm text-muted-foreground">
                    No concepts in this unit yet.
                  </p>
                )}
              </div>
            </section>
          ))
        ) : (
          <p className="rounded-3xl border border-dashed border-border bg-slate-50 px-5 py-6 text-sm text-muted-foreground">
            Add the first unit to start building concept content and prerequisites.
          </p>
        )}
      </div>
    </article>
  )
}

function ConceptForm({
  unitId,
  submitLabel,
  courseConceptOptions,
  concept,
}: {
  unitId: string
  submitLabel: string
  courseConceptOptions: Array<{
    id: string
    title: string
    unitTitle: string
  }>
  concept?: CourseRecord["units"][number]["concepts"][number]
}) {
  const selectedPrerequisiteIds = concept?.prerequisiteEdges.map(
    (prerequisiteEdge) => prerequisiteEdge.prerequisiteConceptId
  )

  return (
    <form action={saveConceptAction} className="mt-6 grid gap-4">
      <input name="returnTo" type="hidden" value={PAGE_PATH} />
      <input name="conceptId" type="hidden" value={concept?.id ?? ""} />
      <input name="unitId" type="hidden" value={unitId} />

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block text-sm font-medium text-foreground">
          Concept title
          <input className={inputClassName} defaultValue={concept?.title ?? ""} name="title" />
        </label>

        <label className="block text-sm font-medium text-foreground">
          Unlock threshold
          <input
            className={inputClassName}
            defaultValue={concept?.unlockThreshold ?? 0.9}
            max={1}
            min={0}
            name="unlockThreshold"
            step="0.01"
            type="number"
          />
        </label>
      </div>

      <label className="block text-sm font-medium text-foreground">
        Description
        <textarea
          className={textareaClassName}
          defaultValue={concept?.description ?? ""}
          name="description"
          rows={3}
        />
      </label>

      <label className="block text-sm font-medium text-foreground">
        Lesson content
        <textarea
          className={textareaClassName}
          defaultValue={concept?.contentBody ?? ""}
          name="contentBody"
          placeholder="Use Markdown and LaTeX to store the lesson explanation, worked examples, and summary."
          rows={8}
        />
      </label>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <ProbabilityField label="P(L0)" name="pLo" value={concept?.pLo ?? 0.15} />
        <ProbabilityField label="P(T)" name="pT" value={concept?.pT ?? 0.1} />
        <ProbabilityField label="P(G)" name="pG" value={concept?.pG ?? 0.2} />
        <ProbabilityField label="P(S)" name="pS" value={concept?.pS ?? 0.1} />
        <ProbabilityField label="Decay λ" name="decayLambda" value={concept?.decayLambda ?? 0.01} />
      </div>

      <label className="block text-sm font-medium text-foreground">
        Prerequisites
        <select
          className={`${selectClassName} min-h-40`}
          defaultValue={selectedPrerequisiteIds}
          multiple
          name="prerequisiteConceptIds"
        >
          {courseConceptOptions
            .filter((option) => option.id !== concept?.id)
            .map((option) => (
              <option key={option.id} value={option.id}>
                {option.unitTitle} - {option.title}
              </option>
            ))}
        </select>
        <span className="mt-2 block text-xs text-muted-foreground">
          Hold Ctrl/Cmd to select multiple prerequisite concepts.
        </span>
      </label>

      <div className="flex flex-wrap gap-3">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
  )
}

function ProbabilityField({
  label,
  name,
  value,
}: {
  label: string
  name: string
  value: number
}) {
  return (
    <label className="block text-sm font-medium text-foreground">
      {label}
      <input
        className={inputClassName}
        defaultValue={value}
        max={1}
        min={0}
        name={name}
        step="0.01"
        type="number"
      />
    </label>
  )
}

function FeedbackBanner({
  tone,
  message,
}: {
  tone: "success" | "error"
  message: string
}) {
  return (
    <div
      className={`rounded-3xl border px-5 py-4 text-sm shadow-sm ${
        tone === "success"
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      {message}
    </div>
  )
}

function StatCard({
  label,
  value,
  icon,
}: {
  label: string
  value: number
  icon: ReactNode
}) {
  return (
    <div className="rounded-3xl bg-secondary p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="rounded-2xl bg-white p-3 text-foreground shadow-sm">{icon}</div>
      </div>
      <p className="mt-4 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-border bg-white px-6 py-10 text-center shadow-sm">
      <h3 className="text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
    </div>
  )
}

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}
