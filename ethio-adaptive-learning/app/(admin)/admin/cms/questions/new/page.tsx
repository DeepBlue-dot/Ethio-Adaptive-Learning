import type { ReactNode } from "react"
import Link from "next/link"
import { ArrowLeft, BookMarked, CircleHelp, Filter } from "lucide-react"

import { requireRole } from "@/lib/auth"
import { sanitizeAdminPath } from "@/lib/cms/forms"
import { getQuestionDifficultyOptions, getQuestionUsageOptions } from "@/lib/curriculum/question"
import { getQuestionEditorCmsData } from "@/lib/curriculum/question-bank"

import { QuestionEditorForm } from "../question-editor-form"

type NewQuestionPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>
}

export default async function NewQuestionPage({ searchParams }: NewQuestionPageProps) {
  await requireRole(["ADMIN", "COURSE_WRITER"])

  const params = (await searchParams) ?? {}
  const returnTo = sanitizeAdminPath(getSingleValue(params.returnTo), "/admin/cms/questions")
  const preselectedConceptId = getSingleValue(params.conceptId)
  const status = getSingleValue(params.status)
  const error = getSingleValue(params.error)
  const data = await getQuestionEditorCmsData()
  const selectedConcept = data.conceptOptions.find((concept) => concept.id === preselectedConceptId)

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

        <div className="mt-6">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
            Question Editor
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-foreground">
            Create a question
          </h1>
          <p className="mt-3 max-w-3xl text-base leading-7 text-muted-foreground">
            Create a new assessment item and attach it to the curriculum concept it belongs to.
          </p>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <MetricCard label="Active courses" value={String(data.courses.length)} icon={<BookMarked className="size-5" />} />
          <MetricCard
            label="Concept options"
            value={String(data.conceptOptions.length)}
            icon={<CircleHelp className="size-5" />}
          />
          <MetricCard
            label="Current focus"
            value={selectedConcept ? selectedConcept.title : "Choose in form"}
            icon={<Filter className="size-5" />}
          />
        </div>
      </section>

      {status ? <FeedbackBanner tone="success" message={status} /> : null}
      {error ? <FeedbackBanner tone="error" message={error} /> : null}

      <QuestionEditorForm
        conceptOptions={data.conceptOptions}
        returnTo={returnTo}
        submitLabel="Create question"
        initialConceptId={selectedConcept?.id}
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
