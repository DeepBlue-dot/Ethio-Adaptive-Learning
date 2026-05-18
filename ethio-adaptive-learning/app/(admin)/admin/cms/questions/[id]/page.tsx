import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, BookMarked, CircleHelp, Trash2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth"
import { sanitizeAdminPath } from "@/lib/cms/forms"
import { formatDistractorsForTextarea, getQuestionDifficultyOptions, getQuestionUsageOptions } from "@/lib/curriculum/question"
import { getQuestionEditorCmsData } from "@/lib/curriculum/question-bank"

import { deleteQuestion } from "../question-actions"
import { QuestionEditorForm } from "../question-editor-form"

type QuestionEditorPageProps = {
  params: Promise<{
    id: string
  }>
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function QuestionEditorPage({ params, searchParams }: QuestionEditorPageProps) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const { id } = await params
  const query = (await searchParams) ?? {}
  const returnTo = sanitizeAdminPath(getSingleValue(query.returnTo), "/admin/cms/questions")
  const status = getSingleValue(query.status)
  const error = getSingleValue(query.error)
  const data = await getQuestionEditorCmsData(id)
  const question = data.question

  if (!question) {
    throw new Error("Question not found.")
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <Link
          href={returnTo}
          className="inline-flex items-center gap-2 text-sm font-medium text-teal-700 transition hover:text-teal-800"
        >
          <ArrowLeft className="size-4" />
          Back to question bank
        </Link>

        <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
              Question Editor
            </p>
            <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
              {question.concept.title}
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
              Refine the question prompt, answer choices, and teaching support text for this concept.
            </p>
          </div>

          <form action={deleteQuestion}>
            <input name="questionId" type="hidden" value={question.id} />
            <input name="returnTo" type="hidden" value={returnTo} />
            <Button type="submit" variant="destructive">
              <Trash2 className="size-4" />
              Delete question
            </Button>
          </form>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricCard label="Course" value={question.concept.unit.course.title} icon={<BookMarked className="size-5" />} />
          <MetricCard label="Unit" value={`Unit ${question.concept.unit.order}`} icon={<CircleHelp className="size-5" />} />
          <MetricCard label="Usage" value={question.usage} icon={<CircleHelp className="size-5" />} />
          <MetricCard label="Difficulty" value={question.difficulty} icon={<CircleHelp className="size-5" />} />
        </div>
      </section>

      {status ? <FeedbackBanner tone="success" message={status} /> : null}
      {error ? <FeedbackBanner tone="error" message={error} /> : null}

      <QuestionEditorForm
        conceptOptions={data.conceptOptions}
        returnTo={returnTo}
        submitLabel="Save question"
        question={{
          id: question.id,
          conceptId: question.conceptId,
          usage: question.usage,
          difficulty: question.difficulty,
          content: question.content,
          correctAnswer: question.correctAnswer,
          distractorsText: formatDistractorsForTextarea(question.distractors),
          hintText: question.hintText ?? "",
          explanation: question.explanation ?? "",
          slug: question.slug,
          createdAt: question.createdAt,
          updatedAt: question.updatedAt,
          authorLabel: question.author?.username ?? null,
        }}
        difficultyOptions={getQuestionDifficultyOptions()}
        usageOptions={getQuestionUsageOptions()}
      />
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

function MetricCard({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: ReactNode
}) {
  return (
    <div className="rounded-3xl bg-secondary p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="rounded-2xl bg-white p-3 text-foreground shadow-sm">{icon}</div>
      </div>
      <p className="mt-4 text-xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function getSingleValue(value: string | string[] | undefined) {
  return typeof value === "string" ? value : undefined
}
