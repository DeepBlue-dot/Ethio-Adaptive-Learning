import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, ShieldCheck, Target } from "lucide-react"

import { ContentBlocksRenderer } from "@/components/content/content-blocks-renderer"
import { ContentReadLogger } from "@/components/student/content-read-logger"
import { QuestionInteraction } from "@/components/student/question-interaction"
import { MasteryBar, StatusBadge, formatDuration, formatPercent } from "@/components/student/student-status"
import { TutorPanel } from "@/components/student/tutor-panel"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth-server"
import { getPracticeQuestionForConcept, getStudentConceptDetail } from "@/lib/student/data"
import type { StudentQuestion } from "@/lib/student/types"

type LearnPageProps = {
  params: Promise<{
    conceptId: string
  }>
}

export default async function StudentLearnPage({ params }: LearnPageProps) {
  const session = await requireRole("STUDENT")
  const { conceptId } = await params
  const concept = await getStudentConceptDetail(session.user.id, conceptId)

  if (!concept) {
    notFound()
  }

  if (concept.status === "LOCKED") {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Button asChild className="w-fit" size="sm" variant="outline">
          <Link href={`/student/concept/${concept.conceptId}`}>
            <ArrowLeft className="size-4" />
            Concept overview
          </Link>
        </Button>
        <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-6 shadow-sm">
          <p className="text-sm font-semibold text-primary">Learn path locked</p>
          <h1 className="mt-2 text-2xl font-extrabold text-on-surface">{concept.title}</h1>
          <p className="mt-3 text-sm leading-6 text-on-surface-variant">
            Finish the prerequisite concepts before opening this instructional workspace.
          </p>
        </section>
      </div>
    )
  }

  let practiceQuestion: StudentQuestion | null = null
  let questionError: string | null = null

  try {
    practiceQuestion = await getPracticeQuestionForConcept(session.user.id, concept.conceptId)
  } catch (error) {
    questionError = error instanceof Error ? error.message : "Practice is unavailable right now."
  }

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <ContentReadLogger conceptId={concept.conceptId} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="text-sm text-on-surface-variant">
          <Link className="hover:text-primary" href="/student">
            Dashboard
          </Link>
          <span className="px-2">/</span>
          <Link className="hover:text-primary" href={`/student/concept/${concept.conceptId}`}>
            {concept.title}
          </Link>
          <span className="px-2">/</span>
          <span>Learn</span>
        </nav>
        <Button asChild size="sm" variant="outline">
          <Link href={`/student/concept/${concept.conceptId}`}>
            <ArrowLeft className="size-4" />
            Concept overview
          </Link>
        </Button>
      </div>

      <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={concept.status} />
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-on-surface-variant">
                Learn path
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold text-on-surface">{concept.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
              Read the lesson, answer adaptive practice, pass the checkpoint, then take the mastery exam.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <ReadinessMetric label="Practice questions" value={concept.practiceQuestionCount} />
              <ReadinessMetric label="Lesson blocks" value={concept.contentBlocks.length} />
              <ReadinessMetric label="Worked examples" value={concept.workedExamples.length} />
            </div>
          </div>
          <div className="rounded-lg border border-outline-variant/50 bg-muted p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-on-surface">Mastery estimate</p>
              <p className="text-2xl font-extrabold text-primary">{formatPercent(concept.pMastery)}</p>
            </div>
            <MasteryBar className="mt-4" value={concept.pMastery} />
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <SmallMetric label="Practice" value={formatPercent(concept.analyticsSnapshot.practiceAccuracy)} />
              <SmallMetric label="Avg time" value={formatDuration(concept.analyticsSnapshot.averageTimePerQuestion)} />
            </div>
            <Button asChild className="mt-4 w-full justify-between">
              <Link href={`/student/concept/${concept.conceptId}/learn/checkpoint`}>
                Go to checkpoint
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="space-y-6">
          <article className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-5 flex items-center gap-2">
              <BookOpen className="size-5 text-primary" />
              <h2 className="text-lg font-bold text-on-surface">Content reader</h2>
            </div>
            <ContentBlocksRenderer
              assets={concept.contentBlockAssets}
              blocks={concept.contentBlocks}
              questions={concept.contentBlockQuestions}
              snippets={concept.contentBlockSnippets}
            />
          </article>

          {concept.chunks.length || concept.workedExamples.length ? (
            <article className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <h2 className="text-lg font-bold text-on-surface">Learn path gate</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <PathStep icon={BookOpen} label="Read" value={`${concept.contentBlocks.length} blocks`} />
                <PathStep icon={CheckCircle2} label="Practice" value={`${concept.practiceQuestionCount} questions`} />
                <PathStep icon={Target} label="Checkpoint" value={concept.checkpointQuestionId ? "Available" : "Unavailable"} />
              </div>
            </article>
          ) : null}
        </section>

        <aside className="space-y-6">
          {practiceQuestion ? (
            <QuestionInteraction
              conceptId={concept.conceptId}
              initialQuestion={practiceQuestion}
              mode="practice"
            />
          ) : (
            <div className="rounded-lg border border-dashed border-outline-variant p-5 text-sm text-on-surface-variant">
              {questionError ?? "Practice opens after prerequisites are complete."}
            </div>
          )}
          <TutorPanel conceptId={concept.conceptId} conceptTitle={concept.title} />
        </aside>
      </div>
    </div>
  )
}

function ReadinessMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-outline-variant/50 bg-muted p-3">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="mt-2 text-lg font-extrabold text-on-surface">{value}</p>
    </div>
  )
}

function SmallMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-background p-3">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="mt-1 text-sm font-bold text-on-surface">{value}</p>
    </div>
  )
}

function PathStep({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-outline-variant/50 bg-muted p-4">
      <div className="flex items-center gap-2 text-sm font-bold text-on-surface">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <p className="mt-2 text-xs text-on-surface-variant">{value}</p>
    </div>
  )
}
