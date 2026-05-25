"use client"

import Link from "next/link"
import { useEffect, useRef, useState, useTransition } from "react"
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Lightbulb,
  RotateCcw,
  XCircle,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  startCheckpointQuestionAction,
  startPracticeQuestionAction,
  submitCheckpointAnswerAction,
  submitPracticeAnswerAction,
  recordTutorHintAction,
} from "@/lib/student/actions"
import type { StudentQuestion } from "@/lib/student/types"
import { cn } from "@/lib/utils"

type QuestionMode = "practice" | "checkpoint"

export function QuestionInteraction({
  conceptId,
  initialQuestion,
  mode,
}: {
  conceptId: string
  initialQuestion: StudentQuestion
  mode: QuestionMode
}) {
  const [question, setQuestion] = useState(initialQuestion)
  const [selectedAnswer, setSelectedAnswer] = useState(initialQuestion.selectedAnswer ?? "")
  const [isSubmitted, setIsSubmitted] = useState(initialQuestion.isCorrect != null)
  const [isCorrect, setIsCorrect] = useState(initialQuestion.isCorrect)
  const [hintVisible, setHintVisible] = useState(false)
  const [completedPracticeCount, setCompletedPracticeCount] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const startedAtRef = useRef(0)
  const isCheckpoint = mode === "checkpoint"

  useEffect(() => {
    startedAtRef.current = Date.now()
  }, [question.attemptId])

  const resetQuestionState = (nextQuestion: StudentQuestion) => {
    setQuestion(nextQuestion)
    setSelectedAnswer(nextQuestion.selectedAnswer ?? "")
    setIsSubmitted(nextQuestion.isCorrect != null)
    setIsCorrect(nextQuestion.isCorrect)
    setHintVisible(false)
    setError(null)
    startedAtRef.current = Date.now()
  }

  const handleSubmit = () => {
    if (!selectedAnswer || isSubmitted || isPending) {
      return
    }

    const now = Date.now()
    const responseTimeMs = now - (startedAtRef.current || now)

    startTransition(async () => {
      const result = isCheckpoint
        ? await submitCheckpointAnswerAction(question.attemptId, selectedAnswer, responseTimeMs)
        : await submitPracticeAnswerAction(question.attemptId, selectedAnswer, responseTimeMs)

      if (!result.ok) {
        setError(result.error)
        return
      }

      setIsSubmitted(true)
      setIsCorrect(result.data.isCorrect)
      if (!isCheckpoint) {
        setCompletedPracticeCount((count) => count + 1)
      }
      setQuestion((current) => ({
        ...current,
        selectedAnswer,
        isCorrect: result.data.isCorrect,
        completedAt: new Date().toISOString(),
      }))
    })
  }

  const handleNext = () => {
    startTransition(async () => {
      const result = isCheckpoint
        ? await startCheckpointQuestionAction(conceptId)
        : await startPracticeQuestionAction(conceptId)

      if (!result.ok) {
        setError(result.error)
        return
      }

      resetQuestionState(result.data)
    })
  }

  return (
    <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-outline-variant/50 p-4">
        <div>
          <p className="text-xs font-semibold text-primary">
            {isCheckpoint ? "Checkpoint gate" : "Adaptive practice"}
          </p>
          <h2 className="mt-1 text-lg font-bold text-on-surface">
            {isCheckpoint ? "Answer correctly to unlock the exam" : "Practice question"}
          </h2>
        </div>
        <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-on-surface-variant">
          {isCheckpoint ? question.difficulty : `${completedPracticeCount} completed`}
        </span>
      </div>

      <div className="space-y-5 p-4">
        <div className="rounded-lg bg-muted p-4 text-sm leading-7 text-on-surface">
          {question.content}
        </div>

        <div className="grid gap-2">
          {question.options.map((option) => {
            const isSelected = selectedAnswer === option.id

            return (
              <button
                key={option.id}
                className={cn(
                  "flex min-h-12 items-center rounded-lg border px-4 py-3 text-left text-sm font-medium transition",
                  isSelected
                    ? "border-primary bg-primary-fixed text-on-primary-fixed"
                    : "border-outline-variant bg-background text-on-surface hover:border-primary/50",
                  isSubmitted && "cursor-default"
                )}
                disabled={isSubmitted || isPending}
                onClick={() => setSelectedAnswer(option.id)}
                type="button"
              >
                {option.text}
              </button>
            )
          })}
        </div>

        {!isCheckpoint && question.hintText ? (
          <div>
            <Button
              disabled={isPending}
              onClick={() => {
                if (!hintVisible) {
                  void recordTutorHintAction(conceptId)
                }

                setHintVisible((value) => !value)
              }}
              size="sm"
              type="button"
              variant="outline"
            >
              <HelpCircle className="size-4" />
              Hint
            </Button>
            {hintVisible ? (
              <div className="mt-3 flex gap-2 rounded-lg border border-primary/20 bg-primary-fixed/40 p-3 text-sm leading-6 text-on-primary-fixed">
                <Lightbulb className="mt-1 size-4 shrink-0" />
                <p>{question.hintText}</p>
              </div>
            ) : null}
          </div>
        ) : null}

        {isSubmitted ? (
          <Feedback
            conceptId={conceptId}
            explanation={question.explanation}
            isCheckpoint={isCheckpoint}
            isCorrect={isCorrect === true}
            onRetry={handleNext}
            pending={isPending}
          />
        ) : null}

        {error ? (
          <div className="rounded-lg border border-error-rose/20 bg-error-container p-3 text-sm text-on-error-container">
            {error}
          </div>
        ) : null}

        {!isSubmitted ? (
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              disabled={!selectedAnswer || isPending}
              onClick={handleSubmit}
              type="button"
            >
              Submit answer
              <ArrowRight className="size-4" />
            </Button>
          </div>
        ) : null}
      </div>
    </section>
  )
}

function Feedback({
  conceptId,
  explanation,
  isCheckpoint,
  isCorrect,
  onRetry,
  pending,
}: {
  conceptId: string
  explanation: string | null
  isCheckpoint: boolean
  isCorrect: boolean
  onRetry: () => void
  pending: boolean
}) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4",
        isCorrect
          ? "border-secondary/20 bg-secondary/10 text-on-surface"
          : "border-error-rose/20 bg-error-container/70 text-on-error-container"
      )}
    >
      <div className="flex items-center gap-2 font-semibold">
        {isCorrect ? <CheckCircle2 className="size-5 text-secondary" /> : <XCircle className="size-5" />}
        {isCorrect ? "Correct" : "Not yet"}
      </div>
      {explanation ? <p className="mt-2 text-sm leading-6">{explanation}</p> : null}

      <div className="mt-4 flex flex-wrap gap-2">
        {isCheckpoint ? (
          isCorrect ? (
            <Button asChild>
              <Link href={`/student/concept/${conceptId}/challenge?pathway=learn`}>
                Take exam
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          ) : (
            <>
              <Button asChild variant="outline">
                <Link href={`/student/concept/${conceptId}/learn`}>Try more practice</Link>
              </Button>
              <Button disabled={pending} onClick={onRetry} type="button">
                <RotateCcw className="size-4" />
                Retry checkpoint
              </Button>
            </>
          )
        ) : (
          <>
            <Button disabled={pending} onClick={onRetry} type="button" variant="outline">
              <RotateCcw className="size-4" />
              Try another
            </Button>
            <Button asChild>
              <Link href={`/student/concept/${conceptId}/learn/checkpoint`}>
                Go to checkpoint
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </>
        )}
      </div>
    </div>
  )
}
