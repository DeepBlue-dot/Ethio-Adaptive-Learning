import Link from "next/link"
import { ArrowRight, BookOpenCheck, BrainCircuit, Clock3, LockKeyhole, RotateCcw } from "lucide-react"

import {
  getConceptLearningWorkspace,
} from "@/lib/assessment"
import { requireRole } from "@/lib/auth"
import { getMasteryStatusLabel } from "@/lib/curriculum"

import {
  startCheckpointAttemptAction,
  startExamAttemptAction,
  startPracticeAttemptAction,
  submitCheckpointAttemptAction,
  submitExamAttemptAction,
  submitPracticeAttemptAction,
} from "./actions"

type PageProps = {
  params: Promise<{
    conceptId: string
  }>
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function LearnConceptPage({ params, searchParams }: PageProps) {
  const session = await requireRole("STUDENT")
  const { conceptId } = await params
  const resolvedSearchParams = await searchParams
  const workspace = await getConceptLearningWorkspace(session.user.id, conceptId)

  return (
    <div className="space-y-8">
      {renderMessage(resolvedSearchParams)}

      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-5">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
              {workspace.concept.courseTitle} / {workspace.concept.unitTitle}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
              {workspace.concept.title}
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {workspace.concept.description ?? "This concept now has lesson content, adaptive practice, and an exam-ready workflow."}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3">
            <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-slate-700">
              {getMasteryStatusLabel(workspace.mastery.status)}
            </span>
            <span className="rounded-full bg-teal-50 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-teal-800">
              {workspace.recommendation === "CHALLENGE_RECOMMENDED" ? "Challenge recommended" : "Learn recommended"}
            </span>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-4">
          <MetricTile
            label="Baseline mastery"
            value={formatPercent(workspace.mastery.baselineMastery)}
            icon={<BrainCircuit className="size-5" />}
          />
          <MetricTile
            label="Effective mastery"
            value={formatPercent(workspace.mastery.effectiveMastery)}
            icon={<Clock3 className="size-5" />}
          />
          <MetricTile
            label="Practice items"
            value={String(workspace.concept.questionCounts.PRACTICE)}
            icon={<BookOpenCheck className="size-5" />}
          />
          <MetricTile
            label="Exam items"
            value={String(workspace.concept.questionCounts.EXAM)}
            icon={<RotateCcw className="size-5" />}
          />
        </div>

        {workspace.mastery.dueForReview && workspace.mastery.nextReviewAt ? (
          <div className="mt-6 rounded-3xl bg-amber-50 px-5 py-4 text-sm text-amber-950">
            Review is due for this concept. The retention threshold was crossed on{" "}
            {formatDateTime(workspace.mastery.nextReviewAt)}.
          </div>
        ) : null}
      </section>

      {!workspace.mastery.unlocked ? (
        <section className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="rounded-2xl bg-amber-100 p-3 text-amber-900">
              <LockKeyhole className="size-5" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold tracking-tight text-amber-950">This concept is still locked</h2>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-amber-900">
                Improve the prerequisite concepts below first. Once their baseline mastery crosses the unlock threshold,
                this workspace will open automatically.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-amber-900">
                {workspace.unmetPrerequisites.map((prerequisite) => (
                  <li key={prerequisite.conceptId}>
                    {prerequisite.title}: {Math.round(prerequisite.currentMastery * 100)}%
                  </li>
                ))}
              </ul>
              <Link
                href="/concepts"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-amber-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-amber-950"
              >
                Return To Concept Map
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </section>
      ) : (
        <>
          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
                Learn pathway
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">
                Study the concept, then earn the mastery exam
              </h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                The Learn path keeps the student in guided mode. Practice is low-stakes, checkpoint results gate access
                to the mastery exam, and the final exam is the only event that changes permanent BKT mastery in Phase 3.
              </p>

              <div className="mt-8 grid gap-4 md:grid-cols-3">
                <StartActionCard
                  title="Practice"
                  description="Guided, low-stakes work that supports the learner without changing permanent mastery."
                  action={startPracticeAttemptAction}
                  conceptId={workspace.concept.id}
                  buttonLabel={workspace.latestPracticeAttempt?.completedAt ? "Start another practice item" : "Start practice"}
                />
                <StartActionCard
                  title="Checkpoint"
                  description="A gate between guided learning and the authoritative mastery exam."
                  action={startCheckpointAttemptAction}
                  conceptId={workspace.concept.id}
                  buttonLabel={
                    workspace.latestCheckpointAttempt?.completedAt ? "Try checkpoint again" : "Start checkpoint"
                  }
                />
                <StartExamCard
                  title="Mastery exam"
                  description="The authoritative Learn-path exam that updates baseline mastery and review scheduling."
                  conceptId={workspace.concept.id}
                  pathway="LEARN"
                  enabled={workspace.canTakeLearnExam}
                  buttonLabel={
                    workspace.latestExamAttempt?.completedAt && workspace.latestExamAttempt.pathway === "LEARN"
                      ? "Retake mastery exam"
                      : "Start mastery exam"
                  }
                />
              </div>
            </article>

            <article className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
                Challenge pathway
              </p>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-foreground">Direct exam route</h2>
              <p className="mt-4 text-sm leading-6 text-muted-foreground">
                Skip the guided checkpoint flow and move straight into the concept exam. This mode is available whenever
                the concept is unlocked and is recommended when effective mastery is already high.
              </p>
              <div className="mt-8">
                <StartExamCard
                  title="Challenge exam"
                  description="No hints and no guided scaffolding. This route goes straight to the concept exam."
                  conceptId={workspace.concept.id}
                  pathway="CHALLENGE"
                  enabled={workspace.canTakeChallengeExam}
                  buttonLabel={
                    workspace.latestExamAttempt?.completedAt && workspace.latestExamAttempt.pathway === "CHALLENGE"
                      ? "Retake challenge exam"
                      : "Start challenge exam"
                  }
                />
              </div>
            </article>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
            <article className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">Lesson content</p>
              <div className="mt-6 space-y-6">
                {workspace.concept.contentBody ? (
                  <LessonSection
                    body={workspace.concept.contentBody}
                    eyebrow="Overview"
                    title="Concept summary"
                  />
                ) : null}

                {workspace.concept.chunks.length ? (
                  <section className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                        Explanation path
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                        Ordered concept chunks
                      </h3>
                    </div>

                    {workspace.concept.chunks.map((chunk) => (
                      <LessonSection
                        key={chunk.id}
                        body={chunk.bodyMd}
                        eyebrow={`Chunk ${chunk.order}`}
                        metadata={chunk.slug}
                        title={chunk.title}
                      />
                    ))}
                  </section>
                ) : null}

                {workspace.concept.workedExamples.length ? (
                  <section className="space-y-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                        Worked examples
                      </p>
                      <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">
                        Guided problem solving
                      </h3>
                    </div>

                    {workspace.concept.workedExamples.map((example) => (
                      <article key={example.id} className="rounded-3xl bg-slate-50 p-6">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                              Example {example.order}
                            </p>
                            <h4 className="mt-2 text-lg font-semibold text-foreground">{example.title}</h4>
                          </div>
                          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
                            {example.slug}
                          </span>
                        </div>

                        <div className="mt-5 grid gap-4 lg:grid-cols-2">
                          <LessonPanel body={example.problemMd} title="Problem" />
                          <LessonPanel body={example.solutionMd} title="Solution" />
                        </div>
                      </article>
                    ))}
                  </section>
                ) : null}

                {!workspace.concept.contentBody &&
                workspace.concept.chunks.length === 0 &&
                workspace.concept.workedExamples.length === 0 ? (
                  <div className="rounded-3xl bg-slate-50 p-6 text-sm leading-7 text-muted-foreground">
                    This concept does not have authored lesson content yet. The assessment flow is
                    still available.
                  </div>
                ) : null}
              </div>
            </article>

            <aside className="space-y-6">
              <AttemptPanel
                title="Practice"
                attempt={workspace.latestPracticeAttempt}
                conceptId={workspace.concept.id}
                emptyMessage="No practice attempt has been opened for this concept yet."
                submitAction={submitPracticeAttemptAction}
              />
              <AttemptPanel
                title="Checkpoint"
                attempt={workspace.latestCheckpointAttempt}
                conceptId={workspace.concept.id}
                emptyMessage="No checkpoint attempt has been opened for this concept yet."
                submitAction={submitCheckpointAttemptAction}
              />
              <ExamPanel attempt={workspace.latestExamAttempt} conceptId={workspace.concept.id} />
            </aside>
          </section>
        </>
      )}
    </div>
  )
}

function renderMessage(searchParams: Record<string, string | string[] | undefined>) {
  const status = getSearchParam(searchParams, "status")
  const error = getSearchParam(searchParams, "error")

  if (!status && !error) {
    return null
  }

  const isError = Boolean(error)
  const message = error ?? status ?? ""

  return (
    <div
      className={`rounded-3xl px-5 py-4 text-sm shadow-sm ${
        isError ? "border border-rose-200 bg-rose-50 text-rose-900" : "border border-emerald-200 bg-emerald-50 text-emerald-900"
      }`}
    >
      {message}
    </div>
  )
}

function MetricTile({
  label,
  value,
  icon,
}: {
  label: string
  value: string
  icon: React.ReactNode
}) {
  return (
    <div className="rounded-3xl bg-secondary p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="text-teal-700">{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

function LessonSection({
  eyebrow,
  title,
  body,
  metadata,
}: {
  eyebrow: string
  title: string
  body: string
  metadata?: string
}) {
  return (
    <article className="rounded-3xl bg-slate-50 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">{eyebrow}</p>
          <h3 className="mt-2 text-xl font-semibold tracking-tight text-foreground">{title}</h3>
        </div>
        {metadata ? (
          <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            {metadata}
          </span>
        ) : null}
      </div>
      <div className="mt-5 whitespace-pre-wrap text-sm leading-7 text-foreground">{body}</div>
    </article>
  )
}

function LessonPanel({
  title,
  body,
}: {
  title: string
  body: string
}) {
  return (
    <section className="rounded-3xl border border-border bg-white p-5">
      <h5 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-700">{title}</h5>
      <div className="mt-4 whitespace-pre-wrap text-sm leading-7 text-foreground">{body}</div>
    </section>
  )
}

function StartActionCard({
  title,
  description,
  action,
  conceptId,
  buttonLabel,
}: {
  title: string
  description: string
  action: (formData: FormData) => void | Promise<void>
  conceptId: string
  buttonLabel: string
}) {
  return (
    <div className="rounded-3xl border border-border bg-slate-50 p-5">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      <form action={action} className="mt-5">
        <input type="hidden" name="conceptId" value={conceptId} />
        <button className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800">
          {buttonLabel}
          <ArrowRight className="size-4" />
        </button>
      </form>
    </div>
  )
}

function StartExamCard({
  title,
  description,
  conceptId,
  pathway,
  enabled,
  buttonLabel,
}: {
  title: string
  description: string
  conceptId: string
  pathway: "LEARN" | "CHALLENGE"
  enabled: boolean
  buttonLabel: string
}) {
  return (
    <div className="rounded-3xl border border-border bg-slate-50 p-5">
      <h3 className="text-lg font-semibold text-foreground">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{description}</p>
      <form action={startExamAttemptAction} className="mt-5">
        <input type="hidden" name="conceptId" value={conceptId} />
        <input type="hidden" name="pathway" value={pathway} />
        <button
          disabled={!enabled}
          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {enabled ? buttonLabel : "Checkpoint required first"}
          <ArrowRight className="size-4" />
        </button>
      </form>
    </div>
  )
}

function AttemptPanel({
  title,
  attempt,
  conceptId,
  emptyMessage,
  submitAction,
}: {
  title: string
  attempt: LearningWorkspace["latestPracticeAttempt"] | LearningWorkspace["latestCheckpointAttempt"]
  conceptId: string
  emptyMessage: string
  submitAction: (formData: FormData) => void | Promise<void>
}) {
  return (
    <section className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">{title}</p>
      {attempt ? (
        attempt.completedAt ? (
          <div className="mt-5 space-y-4">
            <AttemptResult attempt={attempt} />
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            <QuestionPrompt question={attempt.question} />
            <form action={submitAction} className="space-y-4">
              <input type="hidden" name="conceptId" value={conceptId} />
              <input type="hidden" name="attemptId" value={attempt.id} />
              <AnswerFields fieldName="answer" question={attempt.question} />
              <button className="inline-flex items-center gap-2 rounded-full bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800">
                Submit {title}
                <ArrowRight className="size-4" />
              </button>
            </form>
          </div>
        )
      ) : (
        <p className="mt-5 text-sm leading-6 text-muted-foreground">{emptyMessage}</p>
      )}
    </section>
  )
}

function ExamPanel({
  attempt,
  conceptId,
}: {
  attempt: LearningWorkspace["latestExamAttempt"]
  conceptId: string
}) {
  return (
    <section className="rounded-[2rem] border border-border bg-white p-6 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">Exam</p>
      {attempt ? (
        attempt.completedAt ? (
          <div className="mt-5 space-y-5">
            <div className="rounded-3xl bg-slate-50 p-5">
              <p className="text-sm text-muted-foreground">Most recent {attempt.pathway.toLowerCase()} exam</p>
              <p className="mt-2 text-2xl font-semibold text-foreground">
                {attempt.score != null ? `${Math.round(attempt.score * 100)}%` : "Pending"}
              </p>
              <p className="mt-3 text-sm text-muted-foreground">
                {attempt.isPassed ? "Passed" : "Not passed"} • {attempt.correctCount ?? 0}/{attempt.questionCount} correct
              </p>
            </div>
            <div className="space-y-4">
              {attempt.questions.map((question) => (
                <AttemptQuestionReview key={question.id} question={question} />
              ))}
            </div>
          </div>
        ) : (
          <form action={submitExamAttemptAction} className="mt-5 space-y-5">
            <input type="hidden" name="conceptId" value={conceptId} />
            <input type="hidden" name="attemptId" value={attempt.id} />
            {attempt.questions.map((question, index) => (
              <div key={question.id} className="rounded-3xl bg-slate-50 p-5">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
                  Question {index + 1}
                </p>
                <QuestionPrompt question={question} showHint={false} />
                <div className="mt-4">
                  <AnswerFields fieldName={`answer:${question.id}`} question={question} />
                </div>
              </div>
            ))}
            <button className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-black">
              Submit Exam
              <ArrowRight className="size-4" />
            </button>
          </form>
        )
      ) : (
        <p className="mt-5 text-sm leading-6 text-muted-foreground">
          No exam is active right now. Start the mastery or challenge pathway above to begin.
        </p>
      )}
    </section>
  )
}

function QuestionPrompt({
  question,
  showHint = true,
}: {
  question: {
    content: string
    difficulty: string
    hintText: string | null
  }
  showHint?: boolean
}) {
  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">
        {question.difficulty.toLowerCase()} difficulty
      </p>
      <p className="text-sm leading-7 text-foreground">{question.content}</p>
      {showHint && question.hintText ? (
        <p className="rounded-2xl bg-teal-50 px-4 py-3 text-xs leading-6 text-teal-900">
          Hint: {question.hintText}
        </p>
      ) : null}
    </div>
  )
}

function AnswerFields({
  fieldName,
  question,
}: {
  fieldName: string
  question: {
    choices: string[]
  }
}) {
  if (question.choices.length <= 1) {
    return (
      <input
        type="text"
        name={fieldName}
        className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground outline-none ring-0 placeholder:text-muted-foreground"
        placeholder="Type your answer"
        required
      />
    )
  }

  return (
    <div className="space-y-3">
      {question.choices.map((choice) => (
        <label key={choice} className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border bg-white px-4 py-3 text-sm text-foreground">
          <input type="radio" name={fieldName} value={choice} required className="mt-1" />
          <span>{choice}</span>
        </label>
      ))}
    </div>
  )
}

function AttemptResult({
  attempt,
}: {
  attempt: NonNullable<LearningWorkspace["latestPracticeAttempt"]> | NonNullable<LearningWorkspace["latestCheckpointAttempt"]>
}) {
  return (
    <>
      <div
        className={`rounded-3xl px-5 py-4 text-sm ${
          attempt.isCorrect ? "bg-emerald-50 text-emerald-900" : "bg-rose-50 text-rose-900"
        }`}
      >
        {attempt.isCorrect ? "Answered correctly." : "Answered incorrectly."}
      </div>
      <AttemptQuestionReview question={attempt.question} />
    </>
  )
}

function AttemptQuestionReview({
  question,
}: {
  question: {
    content: string
    submittedAnswer?: string | null
    isCorrect?: boolean | null
    explanation: string | null
  }
}) {
  return (
    <div className="rounded-3xl bg-slate-50 p-5">
      <p className="text-sm leading-7 text-foreground">{question.content}</p>
      {question.submittedAnswer ? (
        <p className="mt-3 text-sm text-muted-foreground">
          Your answer: <span className="font-semibold text-foreground">{question.submittedAnswer}</span>
        </p>
      ) : null}
      {typeof question.isCorrect === "boolean" ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Result: <span className="font-semibold text-foreground">{question.isCorrect ? "Correct" : "Incorrect"}</span>
        </p>
      ) : null}
      {question.explanation ? (
        <p className="mt-4 rounded-2xl bg-white px-4 py-3 text-sm leading-6 text-muted-foreground">
          {question.explanation}
        </p>
      ) : null}
    </div>
  )
}

function getSearchParam(searchParams: Record<string, string | string[] | undefined>, key: string) {
  const value = searchParams[key]

  if (Array.isArray(value)) {
    return value[0] ?? null
  }

  return value ?? null
}

function formatPercent(value: number | null) {
  return value == null ? "None yet" : `${Math.round(value * 100)}%`
}

function formatDateTime(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value)
}
