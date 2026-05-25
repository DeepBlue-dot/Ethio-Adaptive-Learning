import Link from "next/link"
import { notFound } from "next/navigation"
import { ArrowLeft, ArrowRight, RotateCcw } from "lucide-react"

import { QuestionInteraction } from "@/components/student/question-interaction"
import { ReviewAlert, formatPercent } from "@/components/student/student-status"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth"
import { getPracticeQuestionForConcept, getStudentConceptDetail } from "@/lib/student/data"
import type { StudentQuestion } from "@/lib/student/types"

type ReviewPageProps = {
  params: Promise<{
    conceptId: string
  }>
}

export default async function StudentConceptReviewPage({ params }: ReviewPageProps) {
  const session = await requireRole("STUDENT")
  const { conceptId } = await params
  const concept = await getStudentConceptDetail(session.user.id, conceptId)

  if (!concept) {
    notFound()
  }

  let practiceQuestion: StudentQuestion | null = null
  let questionError: string | null = null

  if (concept.status !== "LOCKED") {
    try {
      practiceQuestion = await getPracticeQuestionForConcept(session.user.id, concept.conceptId)
    } catch (error) {
      questionError = error instanceof Error ? error.message : "Review practice is unavailable right now."
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button asChild size="sm" variant="outline">
          <Link href="/student/reviews">
            <ArrowLeft className="size-4" />
            Review queue
          </Link>
        </Button>
        <Button asChild>
          <Link href={`/student/concept/${concept.conceptId}/challenge`}>
            Retry exam
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
            <RotateCcw className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">Refresh path</p>
            <h1 className="mt-1 text-2xl font-extrabold text-on-surface">{concept.title}</h1>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Current mastery estimate: {formatPercent(concept.pMastery)}. Use quick practice to warm up,
              then retry the exam when ready.
            </p>
          </div>
        </div>
        <ReviewAlert className="mt-4" />
      </section>

      {practiceQuestion ? (
        <QuestionInteraction
          conceptId={concept.conceptId}
          initialQuestion={practiceQuestion}
          mode="practice"
        />
      ) : (
        <div className="rounded-lg border border-dashed border-outline-variant p-5 text-sm text-on-surface-variant">
          {questionError ?? "Review opens after prerequisites are complete."}
        </div>
      )}
    </div>
  )
}
