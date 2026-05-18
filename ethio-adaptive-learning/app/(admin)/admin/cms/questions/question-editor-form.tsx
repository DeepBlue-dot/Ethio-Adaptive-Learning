"use client"

import { useActionState } from "react"

import { Button } from "@/components/ui/button"
import { initialCmsActionState, type CmsActionState } from "@/lib/cms/types"

import { saveQuestion } from "./question-editor-actions"

const inputClassName =
  "mt-2 w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none transition focus:border-teal-600"
const textareaClassName = `${inputClassName} min-h-28 resize-y`
const selectClassName = inputClassName

const dateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
})

type QuestionEditorFormProps = {
  conceptOptions: Array<{
    id: string
    title: string
    slug: string
    courseTitle: string
    unitTitle: string
    unitOrder: number
  }>
  returnTo: string
  submitLabel: string
  initialConceptId?: string
  question?: {
    id: string
    conceptId: string
    usage: string
    difficulty: string
    content: string
    correctAnswer: string
    distractorsText: string
    hintText: string
    explanation: string
    slug: string
    createdAt: Date
    updatedAt: Date
    authorLabel: string | null
  }
  difficultyOptions: string[]
  usageOptions: string[]
}

export function QuestionEditorForm({
  conceptOptions,
  returnTo,
  submitLabel,
  initialConceptId,
  question,
  difficultyOptions,
  usageOptions,
}: QuestionEditorFormProps) {
  const [state, formAction, isPending] = useActionState(saveQuestion, initialCmsActionState)

  return (
    <form action={formAction} className="space-y-8">
      <input name="questionId" type="hidden" value={question?.id ?? ""} />
      <input name="returnTo" type="hidden" value={returnTo} />

      {state.message ? <FeedbackBanner ok={state.ok} message={state.message} /> : null}

      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block text-sm font-medium text-foreground lg:col-span-2">
            Question prompt
            <textarea
              className={textareaClassName}
              defaultValue={question?.content ?? ""}
              name="content"
              placeholder="Write the question prompt here."
              rows={6}
            />
            <FieldErrors errors={state.fieldErrors} path="content" />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Concept
            <select
              className={selectClassName}
              defaultValue={question?.conceptId ?? initialConceptId ?? ""}
              name="conceptId"
            >
              <option value="">Select a concept</option>
              {conceptOptions.map((concept) => (
                <option key={concept.id} value={concept.id}>
                  {concept.courseTitle} / Unit {concept.unitOrder}: {concept.unitTitle} / {concept.title}
                </option>
              ))}
            </select>
            <FieldErrors errors={state.fieldErrors} path="conceptId" />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Slug
            <input
              className={inputClassName}
              defaultValue={question?.slug ?? ""}
              name="slug"
              placeholder="optional-custom-slug"
            />
            <FieldErrors errors={state.fieldErrors} path="slug" />
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
            <FieldErrors errors={state.fieldErrors} path="usage" />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Difficulty
            <select className={selectClassName} defaultValue={question?.difficulty ?? "MEDIUM"} name="difficulty">
              {difficultyOptions.map((difficulty) => (
                <option key={difficulty} value={difficulty}>
                  {difficulty}
                </option>
              ))}
            </select>
            <FieldErrors errors={state.fieldErrors} path="difficulty" />
          </label>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm font-medium text-foreground">
            Correct answer
            <input className={inputClassName} defaultValue={question?.correctAnswer ?? ""} name="correctAnswer" />
            <FieldErrors errors={state.fieldErrors} path="correctAnswer" />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Distractors
            <textarea
              className={textareaClassName}
              defaultValue={question?.distractorsText ?? ""}
              name="distractors"
              placeholder="One distractor per line"
              rows={5}
            />
            <FieldErrors errors={state.fieldErrors} path="distractors" />
          </label>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <label className="block text-sm font-medium text-foreground">
            Hint
            <textarea
              className={textareaClassName}
              defaultValue={question?.hintText ?? ""}
              name="hintText"
              rows={4}
            />
            <FieldErrors errors={state.fieldErrors} path="hintText" />
          </label>

          <label className="block text-sm font-medium text-foreground">
            Explanation
            <textarea
              className={textareaClassName}
              defaultValue={question?.explanation ?? ""}
              name="explanation"
              rows={5}
            />
            <FieldErrors errors={state.fieldErrors} path="explanation" />
          </label>
        </div>

        {question ? (
          <div className="mt-6 rounded-2xl bg-slate-50 px-4 py-3 text-xs text-muted-foreground">
            <p>
              slug: <span className="font-mono">{question.slug}</span>
            </p>
            {question.authorLabel ? <p className="mt-1">author: {question.authorLabel}</p> : null}
            <p className="mt-1">created: {dateTimeFormatter.format(question.createdAt)}</p>
            <p className="mt-1">updated: {dateTimeFormatter.format(question.updatedAt)}</p>
          </div>
        ) : null}

        <FieldErrors errors={state.fieldErrors} path="form" />

        <div className="mt-6 flex flex-wrap gap-3">
          <Button disabled={isPending} type="submit">
            {isPending ? "Saving..." : submitLabel}
          </Button>
          <Button asChild type="button" variant="outline">
            <a href={returnTo}>Back to question bank</a>
          </Button>
        </div>
      </section>
    </form>
  )
}

function FieldErrors({
  errors,
  path,
}: {
  errors: CmsActionState["fieldErrors"]
  path: string
}) {
  const messages = errors[path]

  if (!messages?.length) {
    return null
  }

  return <p className="mt-2 text-sm text-rose-700">{messages.join(" ")}</p>
}

function FeedbackBanner({
  ok,
  message,
}: {
  ok: boolean
  message: string
}) {
  return (
    <div
      className={`rounded-3xl border px-5 py-4 text-sm shadow-sm ${
        ok
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      {message}
    </div>
  )
}
