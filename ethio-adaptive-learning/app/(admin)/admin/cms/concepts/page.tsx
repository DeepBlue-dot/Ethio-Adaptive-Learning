import type { ReactNode } from "react"
import Link from "next/link"
import { BookOpenText, ChevronRight, Network, PencilRuler, PlusCircle } from "lucide-react"

import {
  createConceptDraft,
} from "./concept-actions"
import {
  deleteCourse,
  saveCourse,
  toggleCourseArchive,
} from "./course-actions"
import {
  deleteUnit,
  saveUnit,
} from "./unit-actions"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth"
import { getCurriculumHierarchyCmsData } from "@/lib/curriculum"

const PAGE_PATH = "/admin/cms/concepts"
const inputClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-600"
const textareaClassName = `${inputClassName} min-h-28 resize-y`
const selectClassName = inputClassName

type ConceptsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type CmsData = Awaited<ReturnType<typeof getCurriculumHierarchyCmsData>>
type CourseRecord = CmsData["courses"][number]
type AuthorRecord = CmsData["authors"][number]

export default async function AdminConceptsPage({ searchParams }: ConceptsPageProps) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const params = (await searchParams) ?? {}
  const status = getSingleValue(params.status)
  const error = getSingleValue(params.error)
  const { authors, activeCourses, archivedCourses } = await getCurriculumHierarchyCmsData()

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          Curriculum CMS
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Hierarchy and concept editor</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Manage course hierarchy here, then open each concept in its dedicated editor to tune BKT
          parameters, prerequisites, and instructional blocks.
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
              Start a curriculum branch and optionally predefine the public slug.
            </p>
          </div>
        </div>

        <form action={saveCourse} className="mt-8 grid gap-4 lg:grid-cols-2">
          <input name="returnTo" type="hidden" value={PAGE_PATH} />

          <label className="block text-sm font-medium text-foreground">
            Course title
            <input className={inputClassName} defaultValue="" name="title" placeholder="Grade 12 Mathematics" />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Slug
            <input className={inputClassName} defaultValue="" name="slug" placeholder="grade-12-mathematics" />
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
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Active curriculum</h2>
          <p className="text-sm text-muted-foreground">
            Use this page to manage the tree. Open a concept to edit its graph and content.
          </p>
        </div>

        {activeCourses.length ? (
          activeCourses.map((course) => <CourseEditor key={course.id} authors={authors} course={course} />)
        ) : (
          <EmptyState
            title="No active courses yet"
            description="Create your first course to start adding units and concept drafts."
          />
        )}
      </section>

      {archivedCourses.length ? (
        <section className="space-y-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Archived courses</h2>
            <p className="text-sm text-muted-foreground">
              Archived courses stay out of the student catalog but can still be restored or cleaned up.
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
            slug: <span className="font-mono">{course.slug}</span>
          </p>
        </div>
      </div>

      <form action={saveCourse} className="mt-8 grid gap-4 lg:grid-cols-2">
        <input name="returnTo" type="hidden" value={PAGE_PATH} />
        <input name="courseId" type="hidden" value={course.id} />

        <label className="block text-sm font-medium text-foreground">
          Course title
          <input className={inputClassName} defaultValue={course.title} name="title" />
        </label>

        <label className="block text-sm font-medium text-foreground">
          Slug
          <input className={inputClassName} defaultValue={course.slug} name="slug" />
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
        <form action={toggleCourseArchive}>
          <input name="returnTo" type="hidden" value={PAGE_PATH} />
          <input name="courseId" type="hidden" value={course.id} />
          <input name="archived" type="hidden" value={course.archivedAt ? "true" : "false"} />
          <Button type="submit" variant="outline">
            {course.archivedAt ? "Restore course" : "Archive course"}
          </Button>
        </form>

        <form action={deleteCourse}>
          <input name="returnTo" type="hidden" value={PAGE_PATH} />
          <input name="courseId" type="hidden" value={course.id} />
          <Button type="submit" variant="destructive">
            Delete course
          </Button>
        </form>
      </div>

      <section className="mt-8 rounded-3xl bg-secondary/50 p-6">
        <h4 className="text-lg font-semibold text-foreground">Create unit</h4>
        <form action={saveUnit} className="mt-4 grid gap-4 lg:grid-cols-[1fr_180px_1fr_auto]">
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

          <label className="block text-sm font-medium text-foreground">
            Slug
            <input className={inputClassName} defaultValue="" name="slug" placeholder="functions-and-graphs" />
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
                  <p className="mt-2 text-sm text-muted-foreground">
                    slug: <span className="font-mono">{unit.slug}</span>
                  </p>
                </div>
              </div>

              <form action={saveUnit} className="mt-6 grid gap-4 lg:grid-cols-[1fr_180px_1fr_auto]">
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

                <label className="block text-sm font-medium text-foreground">
                  Slug
                  <input className={inputClassName} defaultValue={unit.slug} name="slug" />
                </label>

                <div className="flex items-end gap-3">
                  <Button type="submit">Save unit</Button>
                </div>
              </form>

              <div className="mt-4 flex flex-wrap gap-3">
                <form action={deleteUnit}>
                  <input name="returnTo" type="hidden" value={PAGE_PATH} />
                  <input name="unitId" type="hidden" value={unit.id} />
                  <Button type="submit" variant="destructive">
                    Delete unit
                  </Button>
                </form>
              </div>

              <section className="mt-8 rounded-3xl bg-white p-6">
                <h5 className="text-lg font-semibold text-foreground">Create concept draft</h5>
                <p className="mt-2 text-sm text-muted-foreground">
                  Create the shell concept here, then continue in the dedicated editor.
                </p>

                <form action={createConceptDraft} className="mt-4 grid gap-4 lg:grid-cols-[1fr_1fr_auto]">
                  <input name="unitId" type="hidden" value={unit.id} />

                  <label className="block text-sm font-medium text-foreground">
                    Concept title
                    <input className={inputClassName} defaultValue="" name="title" placeholder="Limits" />
                  </label>

                  <label className="block text-sm font-medium text-foreground">
                    Slug
                    <input className={inputClassName} defaultValue="" name="slug" placeholder="limits" />
                  </label>

                  <div className="flex items-end">
                    <Button type="submit">Create draft</Button>
                  </div>
                </form>
              </section>

              <section className="mt-8 rounded-3xl bg-white p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h5 className="text-lg font-semibold text-foreground">Concepts</h5>
                    <p className="text-sm text-muted-foreground">
                      Open each concept in the dedicated editor to manage graph and lesson content.
                    </p>
                  </div>
                </div>

                {unit.concepts.length ? (
                  <div className="mt-5 space-y-3">
                    {unit.concepts.map((concept) => (
                      <Link
                        key={concept.id}
                        href={`${PAGE_PATH}/${concept.id}`}
                        className="flex items-center justify-between gap-4 rounded-3xl border border-border bg-slate-50 px-5 py-4 transition hover:border-teal-300 hover:bg-teal-50/50"
                      >
                        <div>
                          <p className="font-semibold text-foreground">{concept.title}</p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            slug: <span className="font-mono">{concept.slug}</span>
                          </p>
                        </div>
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-teal-700">
                          Edit concept
                          <ChevronRight className="size-4" />
                        </span>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="mt-5 rounded-3xl border border-dashed border-border bg-slate-50 px-5 py-6 text-sm text-muted-foreground">
                    No concepts in this unit yet.
                  </p>
                )}
              </section>
            </section>
          ))
        ) : (
          <p className="rounded-3xl border border-dashed border-border bg-slate-50 px-5 py-6 text-sm text-muted-foreground">
            Add the first unit to start building concept drafts.
          </p>
        )}
      </div>
    </article>
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
