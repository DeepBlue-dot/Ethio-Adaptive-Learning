import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ShieldCheck } from "lucide-react"

import { QuestionInteraction } from "@/components/student/question-interaction"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth"
import {
  getCheckpointQuestionForConcept,
  getStudentConceptDetail,
} from "@/lib/student/data"
import type { StudentQuestion } from "@/lib/student/types"

type CheckpointPageProps = {
  params: Promise<{
    conceptId: string
  }>
}

export default async function StudentCheckpointPage({ params }: CheckpointPageProps) {
  const session = await requireRole("STUDENT")
  const { conceptId } = await params
  const concept = await getStudentConceptDetail(session.user.id, conceptId)

  if (!concept) {
    notFound()
  }

  let checkpointQuestion: StudentQuestion | null = null
  let questionError: string | null = null

  if (concept.status !== "LOCKED") {
    try {
      checkpointQuestion = await getCheckpointQuestionForConcept(session.user.id, concept.conceptId)
    } catch (error) {
      questionError = error instanceof Error ? error.message : "Checkpoint is unavailable right now."
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="text-sm text-on-surface-variant">
          <Link className="hover:text-primary" href="/student">
            Dashboard
          </Link>
          <span className="px-2">/</span>
          <Link className="hover:text-primary" href={`/student/concept/${concept.conceptId}/learn`}>
            Learn
          </Link>
          <span className="px-2">/</span>
          <span>Checkpoint</span>
        </nav>
        <Button asChild size="sm" variant="outline">
          <Link href={`/student/concept/${concept.conceptId}/learn`}>
            <ArrowLeft className="size-4" />
            Back to practice
          </Link>
        </Button>
      </div>

      <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
            <ShieldCheck className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">Checkpoint</p>
            <h1 className="mt-1 text-2xl font-extrabold text-on-surface">{concept.title}</h1>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              You must answer this question correctly to unlock the mastery exam. Hints are disabled here.
            </p>
          </div>
        </div>
      </section>

      {checkpointQuestion ? (
        <QuestionInteraction
          conceptId={concept.conceptId}
          initialQuestion={checkpointQuestion}
          mode="checkpoint"
        />
      ) : (
        <div className="rounded-lg border border-dashed border-outline-variant p-5 text-sm text-on-surface-variant">
          {questionError ?? "Checkpoint opens after prerequisites are complete."}
        </div>
      )}
    </div>
  )
}
