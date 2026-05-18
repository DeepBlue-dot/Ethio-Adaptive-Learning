import type { ReactNode } from "react"
import Link from "next/link"
import { BookMarked, CircleHelp, Filter, PencilLine, PlusCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth"
import { parseQuestionFilterInput } from "@/lib/cms/schemas/question-filter-schema"
import { getQuestionBankCmsData } from "@/lib/curriculum/question-bank"

const QUESTIONS_PATH = "/admin/cms/questions"
const inputClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-600"
const selectClassName = inputClassName

type AdminQuestionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type QuestionData = Awaited<ReturnType<typeof getQuestionBankCmsData>>

export default async function AdminQuestionsPage({ searchParams }: AdminQuestionsPageProps) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const params = (await searchParams) ?? {}
  const parsedFilters = parseQuestionFilterInput(params)
  const filters = parsedFilters.success ? parsedFilters.data : {}
  const status = getSingleValue(params.status)
  const error = getSingleValue(params.error)

  const { courses, questions } = await getQuestionBankCmsData(filters)
  const visibleUnits = filters.courseId
    ? courses.find((course) => course.id === filters.courseId)?.units ?? []
    : courses.flatMap((course) => course.units)
  const visibleConcepts = filters.unitId
    ? visibleUnits.find((unit) => unit.id === filters.unitId)?.concepts ?? []
    : visibleUnits.flatMap((unit) => unit.concepts)
  const returnTo = buildQuestionsPath(filters)
  const createPath = buildQuestionCreatePath(filters, returnTo)

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
              Question Bank
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight">Assessment item library</h1>
            <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
              Browse and filter the question bank here, then open a dedicated editor to create or
              refine assessment items tied to the curriculum graph.
            </p>
          </div>

          <Button asChild>
            <Link href={createPath}>
              <PlusCircle className="size-4" />
              New question
            </Link>
          </Button>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Visible questions" value={questions.length} icon={<BookMarked className="size-5" />} />
          <StatCard label="Available units" value={visibleUnits.length} icon={<Filter className="size-5" />} />
          <StatCard label="Available concepts" value={visibleConcepts.length} icon={<CircleHelp className="size-5" />} />
        </div>
      </section>

      {status ? <FeedbackBanner tone="success" message={status} /> : null}
      {error ? <FeedbackBanner tone="error" message={error} /> : null}

      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
            <Filter className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Filter the question bank</h2>
            <p className="text-sm text-muted-foreground">
              Narrow the bank by course, unit, or concept and keep the browser URL shareable.
            </p>
          </div>
        </div>

        <form className="mt-8 grid gap-4 md:grid-cols-4">
          <label className="block text-sm font-medium text-foreground">
            Course
            <select className={selectClassName} defaultValue={filters.courseId ?? ""} name="courseId">
              <option value="">All courses</option>
              {courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-foreground">
            Unit
            <select className={selectClassName} defaultValue={filters.unitId ?? ""} name="unitId">
              <option value="">All units</option>
              {visibleUnits.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  Unit {unit.order}: {unit.title}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm font-medium text-foreground">
            Concept
            <select className={selectClassName} defaultValue={filters.conceptId ?? ""} name="conceptId">
              <option value="">All concepts</option>
              {visibleConcepts.map((concept) => (
                <option key={concept.id} value={concept.id}>
                  {concept.title}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-end gap-3">
            <Button type="submit">Apply filters</Button>
            <Button asChild variant="outline">
              <Link href={QUESTIONS_PATH}>Reset</Link>
            </Button>
          </div>
        </form>
      </section>

      <section className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Existing questions</h2>
            <p className="text-sm text-muted-foreground">
              Open a dedicated editor for each item to manage prompt, answers, hints, and explanations.
            </p>
          </div>

          <Button asChild variant="outline">
            <Link href={createPath}>
              <PlusCircle className="size-4" />
              Create question
            </Link>
          </Button>
        </div>

        {questions.length ? (
          <div className="space-y-4">
            {questions.map((question) => (
              <Link
                key={question.id}
                href={buildQuestionEditPath(question.id, returnTo)}
                className="block rounded-[2rem] border border-border bg-white p-8 shadow-sm transition hover:border-teal-300 hover:bg-teal-50/40"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                      {question.concept.unit.course.title} / Unit {question.concept.unit.order}: {question.concept.unit.title}
                    </p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight text-foreground">
                      {question.concept.title}
                    </h3>
                    <p className="mt-3 line-clamp-3 max-w-4xl text-sm leading-6 text-muted-foreground">
                      {question.content}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground">
                        {question.usage}
                      </span>
                      <span className="rounded-full bg-secondary px-3 py-1 font-medium text-secondary-foreground">
                        {question.difficulty}
                      </span>
                      <span>slug: <span className="font-mono">{question.slug}</span></span>
                      {question.author ? <span>author: {question.author.username}</span> : null}
                    </div>
                  </div>

                  <span className="inline-flex items-center gap-2 text-sm font-medium text-teal-700">
                    Edit question
                    <PencilLine className="size-4" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState
            title="No questions match the current filters"
            description="Create the first question for this curriculum slice, or broaden the filters above."
          />
        )}
      </section>
    </div>
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

function buildQuestionsPath(filters: {
  courseId?: string
  unitId?: string
  conceptId?: string
}) {
  const params = new URLSearchParams()

  if (filters.courseId) {
    params.set("courseId", filters.courseId)
  }

  if (filters.unitId) {
    params.set("unitId", filters.unitId)
  }

  if (filters.conceptId) {
    params.set("conceptId", filters.conceptId)
  }

  const query = params.toString()

  return query ? `${QUESTIONS_PATH}?${query}` : QUESTIONS_PATH
}

function buildQuestionCreatePath(
  filters: {
    courseId?: string
    unitId?: string
    conceptId?: string
  },
  returnTo: string
) {
  const params = new URLSearchParams()

  params.set("returnTo", returnTo)

  if (filters.courseId) {
    params.set("courseId", filters.courseId)
  }

  if (filters.unitId) {
    params.set("unitId", filters.unitId)
  }

  if (filters.conceptId) {
    params.set("conceptId", filters.conceptId)
  }

  return `${QUESTIONS_PATH}/new?${params.toString()}`
}

function buildQuestionEditPath(questionId: string, returnTo: string) {
  const params = new URLSearchParams()

  if (returnTo !== QUESTIONS_PATH) {
    params.set("returnTo", returnTo)
  }

  const query = params.toString()

  return query ? `${QUESTIONS_PATH}/${questionId}?${query}` : `${QUESTIONS_PATH}/${questionId}`
}

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}
