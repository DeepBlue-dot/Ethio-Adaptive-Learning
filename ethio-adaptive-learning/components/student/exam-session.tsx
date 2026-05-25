"use client"

import Link from "next/link"
import { useEffect, useMemo, useState, useTransition } from "react"
import { ArrowRight, CheckCircle2, Clock3, Send, XCircle } from "lucide-react"

import { Button } from "@/components/ui/button"
import { submitExamAnswersAction } from "@/lib/student/actions"
import type { StudentExamResult, StudentExamSession } from "@/lib/student/types"
import { cn } from "@/lib/utils"

export function ExamSession({ session }: { session: StudentExamSession }) {
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [result, setResult] = useState<StudentExamResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const answeredCount = Object.values(answers).filter(Boolean).length
  const canSubmit = answeredCount === session.questionCount && !result
  const formattedElapsed = useMemo(() => formatSeconds(elapsedSeconds), [elapsedSeconds])

  useEffect(() => {
    if (result) {
      return
    }

    const interval = window.setInterval(() => {
      setElapsedSeconds((value) => value + 1)
    }, 1000)

    return () => window.clearInterval(interval)
  }, [result])

  const handleSubmit = () => {
    if (!canSubmit || isPending) {
      return
    }

    startTransition(async () => {
      const actionResult = await submitExamAnswersAction(session.attemptId, answers)

      if (!actionResult.ok) {
        setError(actionResult.error)
        return
      }

      setResult(actionResult.data)
    })
  }

  if (result) {
    return <ExamResult conceptId={session.conceptId} result={result} />
  }

  return (
    <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/50 p-4">
        <div>
          <p className="text-xs font-semibold text-primary">
            {session.pathway === "LEARN" ? "Learn pathway exam" : "Challenge pathway"}
          </p>
          <h2 className="mt-1 text-lg font-bold text-on-surface">Mastery exam</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            No hints or feedback are available until the exam is submitted.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-outline-variant/50 bg-muted px-3 py-2 text-sm font-semibold text-on-surface">
          <Clock3 className="size-4 text-primary" />
          {formattedElapsed}
        </div>
      </div>

      <div className="space-y-4 p-4">
        {session.questions.map((question, index) => (
          <article key={question.questionId} className="rounded-lg border border-outline-variant/50 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-on-surface">
                Question {index + 1} of {session.questionCount}
              </h3>
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-on-surface-variant">
                {question.difficulty}
              </span>
            </div>
            <p className="mt-3 rounded-lg bg-muted p-3 text-sm leading-7 text-on-surface">
              {question.content}
            </p>
            <div className="mt-3 grid gap-2">
              {question.options.map((option) => {
                const isSelected = answers[question.questionId] === option.id

                return (
                  <button
                    key={option.id}
                    className={cn(
                      "min-h-12 rounded-lg border px-4 py-3 text-left text-sm font-medium transition",
                      isSelected
                        ? "border-primary bg-primary-fixed text-on-primary-fixed"
                        : "border-outline-variant bg-background text-on-surface hover:border-primary/50"
                    )}
                    disabled={isPending}
                    onClick={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.questionId]: option.id,
                      }))
                    }
                    type="button"
                  >
                    {option.text}
                  </button>
                )
              })}
            </div>
          </article>
        ))}

        {error ? (
          <div className="rounded-lg border border-error-rose/20 bg-error-container p-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-outline-variant/50 pt-4">
          <p className="text-sm text-on-surface-variant">
            {answeredCount} of {session.questionCount} answered
          </p>
          <Button disabled={!canSubmit || isPending} onClick={handleSubmit} type="button">
            <Send className="size-4" />
            Submit exam
          </Button>
        </div>
      </div>
    </section>
  )
}

function ExamResult({
  conceptId,
  result,
}: {
  conceptId: string
  result: StudentExamResult
}) {
  return (
    <section
      className={cn(
        "rounded-lg border p-6 shadow-sm",
        result.isPassed
          ? "border-secondary/20 bg-secondary/10"
          : "border-error-rose/20 bg-error-container/70"
      )}
    >
      <div className="flex items-center gap-3">
        {result.isPassed ? (
          <CheckCircle2 className="size-7 text-secondary" />
        ) : (
          <XCircle className="size-7 text-on-error-container" />
        )}
        <div>
          <p className="text-sm font-semibold text-on-surface">
            {result.isPassed ? "Concept mastered" : "Practice recommended"}
          </p>
          <h2 className="text-2xl font-bold text-on-surface">
            {result.score}% score
          </h2>
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <ResultMetric label="Correct" value={`${result.correctCount}/${result.questionCount}`} />
        <ResultMetric label="Time spent" value={formatSeconds(result.timeSpentSec)} />
        <ResultMetric label="Unlocks" value={result.unlockedNewConcepts ? "Updated" : "No change"} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {result.isPassed ? (
          <Button asChild>
            <Link href="/student">
              Back to dashboard
              <ArrowRight className="size-4" />
            </Link>
          </Button>
        ) : (
          <>
            <Button asChild>
              <Link href={`/student/concept/${conceptId}/learn`}>
                Continue learning
                <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href={`/student/concept/${conceptId}`}>Concept overview</Link>
            </Button>
          </>
        )}
      </div>
    </section>
  )
}

function ResultMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-3">
      <p className="text-xs font-medium text-on-surface-variant">{label}</p>
      <p className="mt-1 text-lg font-bold text-on-surface">{value}</p>
    </div>
  )
}

function formatSeconds(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}
