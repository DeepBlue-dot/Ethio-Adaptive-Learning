import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2 } from "lucide-react"

import { ContentBlocksRenderer } from "@/components/content/content-blocks-renderer"
import { ContentReadLogger } from "@/components/student/content-read-logger"
import { QuestionInteraction } from "@/components/student/question-interaction"
import { TutorPanel } from "@/components/student/tutor-panel"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth"
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
          <p className="text-sm font-semibold text-primary">Learning path locked</p>
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
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-primary">Instructional workspace</p>
            <h1 className="mt-2 text-3xl font-extrabold text-on-surface">{concept.title}</h1>
            <p className="mt-2 text-sm text-on-surface-variant">
              Content, practice, checkpoint, then mastery exam.
            </p>
          </div>
          <Button asChild>
            <Link href={`/student/concept/${concept.conceptId}/learn/checkpoint`}>
              Proceed to checkpoint
              <ArrowRight className="size-4" />
            </Link>
          </Button>
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
                <CheckCircle2 className="size-5 text-primary" />
                <h2 className="text-lg font-bold text-on-surface">Checkpoint readiness</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <ReadinessMetric label="Chunks" value={concept.chunks.length} />
                <ReadinessMetric label="Worked examples" value={concept.workedExamples.length} />
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
    <div className="rounded-lg bg-muted p-4">
      <p className="text-sm text-on-surface-variant">{label}</p>
      <p className="mt-2 text-2xl font-extrabold text-on-surface">{value}</p>
    </div>
  )
}
