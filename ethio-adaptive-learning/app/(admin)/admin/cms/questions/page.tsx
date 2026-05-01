import type { ReactNode } from "react"
import { BookMarked, CircleHelp, Filter } from "lucide-react"

import { deleteQuestionAction, saveQuestionAction } from "./actions"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth"
import {
  formatDistractorsForTextarea,
  getDifficultyOptions,
  getQuestionCmsData,
  getQuestionUsageOptions,
} from "@/lib/curriculum"

const inputClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-600"
const textareaClassName = `${inputClassName} min-h-28 resize-y`
const selectClassName = inputClassName

type AdminQuestionsPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

type QuestionData = Awaited<ReturnType<typeof getQuestionCmsData>>
type QuestionRecord = QuestionData["questions"][number]

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

export default async function AdminQuestionsPage({
  searchParams,
}: AdminQuestionsPageProps) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const params = (await searchParams) ?? {}
  const filters = {
    courseId: getSingleValue(params.courseId),
    unitId: getSingleValue(params.unitId),
    conceptId: getSingleValue(params.conceptId),
  }
  const status = getSingleValue(params.status)
  const error = getSingleValue(params.error)
  const { courses, questions } = await getQuestionCmsData(filters)

  const visibleUnits = filters.courseId
    ? courses.find((course) => course.id === filters.courseId)?.units ?? []
    : courses.flatMap((course) => course.units)
  const visibleConcepts = filters.unitId
    ? visibleUnits.find((unit) => unit.id === filters.unitId)?.concepts ?? []
    : visibleUnits.flatMap((unit) => unit.concepts)
  const returnTo = buildQuestionsPath(filters)

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
          Question Bank
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight">Assessment item authoring</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-muted-foreground">
          Manage practice, checkpoint, and exam questions against the same concept graph that drives
          student progression.
        </p>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <StatCard label="Visible questions" value={questions.length} icon={<BookMarked className="size-5" />} />
          <StatCard
            label="Available units"
            value={visibleUnits.length}
            icon={<Filter className="size-5" />}
          />
          <StatCard
            label="Available concepts"
            value={visibleConcepts.length}
            icon={<CircleHelp className="size-5" />}
          />
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
              Narrow the list by course, unit, or concept while keeping the authoring flow server-rendered.
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
                  {unit.title}
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
              <a href="/admin/cms/questions">Reset</a>
            </Button>
          </div>
        </form>
      </section>

      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
            <BookMarked className="size-5" />
          </div>
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Create a new question</h2>
            <p className="text-sm text-muted-foreground">
              Questions are authored against concepts and tagged by difficulty and usage type.
            </p>
          </div>
        </div>

        <QuestionForm conceptOptions={visibleConcepts} returnTo={returnTo} submitLabel="Create question" />
      </section>

      <section className="space-y-6">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Existing questions</h2>
          <p className="text-sm text-muted-foreground">
            Each item stays linked to its concept, usage mode, and difficulty tier.
          </p>
        </div>

        {questions.length ? (
          questions.map((question) => (
            <article key={question.id} className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                    {question.concept.unit.course.title} / Unit {question.concept.unit.order}
                  </p>
                  <h3 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                    {question.concept.title}
                  </h3>
                  <p className="mt-3 text-sm text-muted-foreground">
                    {question.difficulty} • {question.usage}
                    {question.author ? ` • authored by ${question.author.username}` : ""}
                  </p>
                  <p className="mt-2 text-xs text-muted-foreground">
                    concept slug: <span className="font-mono">{question.concept.slug}</span>
                  </p>
                </div>
              </div>

              <QuestionForm
                conceptOptions={visibleConcepts}
                question={question}
                returnTo={returnTo}
                submitLabel="Save question"
              />

              <form action={deleteQuestionAction} className="mt-4">
                <input name="questionId" type="hidden" value={question.id} />
                <input name="returnTo" type="hidden" value={returnTo} />
                <Button type="submit" variant="destructive">
                  Delete question
                </Button>
              </form>
            </article>
          ))
        ) : (
          <EmptyState
            title="No questions match the current filters"
            description="Create the first question for this curriculum slice, or broaden the topic filters above."
          />
        )}
      </section>
    </div>
  )
}

function QuestionForm({
  submitLabel,
  conceptOptions,
  returnTo,
  question,
}: {
  submitLabel: string
  conceptOptions: Array<{
    id: string
    title: string
    unitId: string
  }>
  returnTo: string
  question?: QuestionRecord
}) {
  const difficultyOptions = getDifficultyOptions()
  const usageOptions = getQuestionUsageOptions()

  return (
    <form action={saveQuestionAction} className="mt-8 grid gap-4">
      <input name="questionId" type="hidden" value={question?.id ?? ""} />
      <input name="returnTo" type="hidden" value={returnTo} />

      <div className="grid gap-4 lg:grid-cols-3">
        <label className="block text-sm font-medium text-foreground">
          Concept
          <select className={selectClassName} defaultValue={question?.conceptId ?? ""} name="conceptId">
            <option value="">Select a concept</option>
            {conceptOptions.map((concept) => (
              <option key={concept.id} value={concept.id}>
                {concept.title}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-foreground">
          Usage
          <select className={selectClassName} defaultValue={question?.usage ?? "PRACTICE"} name="usage">
            {usageOptions.map((usage) => (
              <option key={usage} value={usage}>
                {usage}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-foreground">
          Difficulty
          <select
            className={selectClassName}
            defaultValue={question?.difficulty ?? "MEDIUM"}
            name="difficulty"
          >
            {difficultyOptions.map((difficulty) => (
              <option key={difficulty} value={difficulty}>
                {difficulty}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-sm font-medium text-foreground">
        Question prompt
        <textarea
          className={textareaClassName}
          defaultValue={question?.content ?? ""}
          name="content"
          placeholder="Write the question prompt here."
          rows={5}
        />
      </label>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block text-sm font-medium text-foreground">
          Correct answer
          <input className={inputClassName} defaultValue={question?.correctAnswer ?? ""} name="correctAnswer" />
        </label>

        <label className="block text-sm font-medium text-foreground">
          Distractors
          <textarea
            className={textareaClassName}
            defaultValue={formatDistractorsForTextarea(question?.distractors ?? null)}
            name="distractors"
            placeholder="One distractor per line"
            rows={5}
          />
        </label>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <label className="block text-sm font-medium text-foreground">
          Hint
          <textarea
            className={textareaClassName}
            defaultValue={question?.hintText ?? ""}
            name="hintText"
            rows={3}
          />
        </label>

        <label className="block text-sm font-medium text-foreground">
          Explanation
          <textarea
            className={textareaClassName}
            defaultValue={question?.explanation ?? ""}
            name="explanation"
            rows={5}
          />
        </label>
      </div>

      {question ? (
        <MetadataRow
          authorLabel={question.author?.username ?? null}
          createdAt={question.createdAt}
          slug={question.slug}
          updatedAt={question.updatedAt}
        />
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit">{submitLabel}</Button>
      </div>
    </form>
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

function MetadataRow({
  slug,
  createdAt,
  updatedAt,
  authorLabel,
}: {
  slug: string
  createdAt: Date
  updatedAt: Date
  authorLabel: string | null
}) {
  return (
    <div className="rounded-2xl bg-slate-50 px-4 py-3 text-xs text-muted-foreground">
      <p>
        slug: <span className="font-mono">{slug}</span>
      </p>
      {authorLabel ? <p className="mt-1">author: {authorLabel}</p> : null}
      <p className="mt-1">created: {dateTimeFormatter.format(createdAt)}</p>
      <p className="mt-1">updated: {dateTimeFormatter.format(updatedAt)}</p>
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

  return query ? `/admin/cms/questions?${query}` : "/admin/cms/questions"
}

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}
