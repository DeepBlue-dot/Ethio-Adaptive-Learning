import Link from "next/link"
import { notFound } from "next/navigation"
import { PathwayType } from "@prisma/client"
import { AlertTriangle, ArrowLeft, Target } from "lucide-react"

import { ExamSession } from "@/components/student/exam-session"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth-server"
import { getStudentConceptDetail, getStudentExamSession } from "@/lib/student/data"
import type { StudentExamSession } from "@/lib/student/types"

type ChallengePageProps = {
  params: Promise<{
    conceptId: string
  }>
  searchParams: Promise<{
    pathway?: string
  }>
}

export default async function StudentChallengePage({
  params,
  searchParams,
}: ChallengePageProps) {
  const session = await requireRole("STUDENT")
  const [{ conceptId }, query] = await Promise.all([params, searchParams])
  const concept = await getStudentConceptDetail(session.user.id, conceptId)

  if (!concept) {
    notFound()
  }

  const pathway = query.pathway?.toLowerCase() === "learn" ? PathwayType.LEARN : PathwayType.CHALLENGE
  let examSession: StudentExamSession | null = null
  let examError: string | null = null

  if (concept.status !== "LOCKED") {
    try {
      examSession = await getStudentExamSession(session.user.id, concept.conceptId, pathway)
    } catch (error) {
      examError = error instanceof Error ? error.message : "Exam is unavailable right now."
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
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
          <span>Challenge</span>
        </nav>
        <Button asChild size="sm" variant="outline">
          <Link href={`/student/concept/${concept.conceptId}`}>
            <ArrowLeft className="size-4" />
            Concept overview
          </Link>
        </Button>
      </div>

      <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary-fixed text-on-primary-fixed">
            <Target className="size-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-primary">
              {pathway === PathwayType.LEARN ? "Mastery exam" : "Direct challenge"}
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-on-surface">{concept.title}</h1>
            <p className="mt-2 text-sm leading-6 text-on-surface-variant">
              Answer questions to demonstrate mastery. No hints or feedback are shown during the exam.
            </p>
          </div>
        </div>
      </section>

      {examSession ? (
        <ExamSession session={examSession} />
      ) : (
        <div className="rounded-lg border border-error-rose/20 bg-error-container p-5 text-on-error-container">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 size-5 shrink-0" />
            <div>
              <p className="font-semibold">Exam locked</p>
              <p className="mt-1 text-sm leading-6">
                {examError ?? "Complete prerequisites or pass the checkpoint before starting this exam."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button asChild variant="outline">
                  <Link href={`/student/concept/${concept.conceptId}/learn`}>Go to learn path</Link>
                </Button>
                <Button asChild variant="outline">
                  <Link href={`/student/concept/${concept.conceptId}/learn/checkpoint`}>
                    Retry checkpoint
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
