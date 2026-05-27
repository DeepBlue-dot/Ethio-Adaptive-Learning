import Link from "next/link"
import { notFound } from "next/navigation"
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ImageIcon,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
} from "lucide-react"

import { ContentBlocksRenderer } from "@/components/content/content-blocks-renderer"
import { ContentReadLogger } from "@/components/student/content-read-logger"
import { QuestionInteraction } from "@/components/student/question-interaction"
import { MasteryBar, StatusBadge, formatDuration, formatPercent } from "@/components/student/student-status"
import { TutorPanel } from "@/components/student/tutor-panel"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth-server"
import { loadSessionMessages } from "@/lib/ai/tutoring/socratic-engine"
import { getPracticeQuestionForConcept, getStudentConceptDetail } from "@/lib/student/data"
import type { StudentQuestion } from "@/lib/student/types"

type LearnPageProps = {
  params: Promise<{
    conceptId: string
  }>
  searchParams: Promise<{
    page?: string
  }>
}

export default async function StudentLearnPage({ params, searchParams }: LearnPageProps) {
  const session = await requireRole("STUDENT")
  const { conceptId } = await params
  const { page: pageParam } = await searchParams
  const concept = await getStudentConceptDetail(session.user.id, conceptId)

  if (!concept) {
    notFound()
  }

  const currentPage = Math.max(1, parseInt(pageParam ?? "1", 10))
  const BLOCKS_PER_PAGE = 5
  const totalPages = Math.ceil(concept.contentBlocks.length / BLOCKS_PER_PAGE)
  const paginatedBlocks = concept.contentBlocks.slice(
    (currentPage - 1) * BLOCKS_PER_PAGE,
    currentPage * BLOCKS_PER_PAGE
  )

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

  const mediaAssets = Object.values(concept.contentBlockAssets)
  const leadImage = mediaAssets.find((asset) => asset.kind === "IMAGE" && asset.url)
  const hasVideo = concept.contentBlocks.some((block) => block.type === "video")
  const hasSimulation = mediaAssets.some((asset) => asset.kind === "PHET_SIMULATION")
  const tutorMessages = await loadSessionMessages(session.user.id, concept.conceptId)
  const lessonSteps = [
    {
      icon: BookOpen,
      label: "Read",
      value: `${concept.contentBlocks.length} blocks`,
    },
    {
      icon: PlayCircle,
      label: "Watch",
      value: hasVideo ? "Video ready" : "Optional",
    },
    {
      icon: Sparkles,
      label: "Explore",
      value: hasSimulation ? "Simulation" : `${mediaAssets.length} media`,
    },
    {
      icon: Target,
      label: "Practice",
      value: `${concept.practiceQuestionCount} questions`,
    },
  ]

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      {currentPage === totalPages && <ContentReadLogger conceptId={concept.conceptId} />}

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

      <section className="overflow-hidden rounded-lg border border-outline-variant/50 bg-surface-container-lowest shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_390px]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <StatusBadge status={concept.status} />
              <span className="rounded-md bg-muted px-2 py-1 text-xs font-semibold text-on-surface-variant">
                Learn path
              </span>
              <span className="rounded-md bg-primary-fixed px-2 py-1 text-xs font-semibold text-on-primary-fixed">
                {concept.course.title}
              </span>
            </div>
            <h1 className="mt-3 text-3xl font-extrabold text-on-surface">{concept.title}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
              {concept.description ??
                "Read the lesson, answer adaptive practice, pass the checkpoint, then take the mastery exam."}
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {lessonSteps.map((step) => (
                <ReadinessMetric key={step.label} icon={step.icon} label={step.label} value={step.value} />
              ))}
            </div>
          </div>

          <div
            className="relative min-h-72 border-t border-outline-variant/50 bg-muted p-5 lg:border-l lg:border-t-0"
            style={
              leadImage?.url
                ? {
                    backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.72), rgba(0,0,0,0.14)), url(${leadImage.url})`,
                    backgroundPosition: "center",
                    backgroundSize: "cover",
                  }
                : undefined
            }
          >
            {leadImage?.url ? (
              <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                <p className="text-xs font-bold uppercase">Visual lesson</p>
                <p className="mt-1 text-sm leading-5 text-white/85">
                  {leadImage.caption ?? leadImage.title ?? "Use the visual cue before trying the adaptive practice."}
                </p>
              </div>
            ) : null}
            <div className="relative ml-auto w-full max-w-sm rounded-lg border border-outline-variant/50 bg-background/95 p-4 shadow-sm">
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
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_430px]">
        <section className="space-y-6">
          <article className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                <h2 className="text-lg font-bold text-on-surface">Interactive lesson</h2>
              </div>
              <div className="flex flex-wrap gap-2">
                <MediaPill icon={ImageIcon} label={`${mediaAssets.length} media`} />
                {hasVideo ? <MediaPill icon={PlayCircle} label="Video" /> : null}
                {hasSimulation ? <MediaPill icon={Sparkles} label="Simulation" /> : null}
              </div>
            </div>
            <ContentBlocksRenderer
              assets={concept.contentBlockAssets}
              blocks={paginatedBlocks}
              questions={concept.contentBlockQuestions}
              snippets={concept.contentBlockSnippets}
            />

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-outline-variant/50 pt-6">
                {currentPage > 1 ? (
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/student/concept/${concept.conceptId}/learn?page=${currentPage - 1}`}>
                      <ArrowLeft className="mr-2 size-4" />
                      Previous
                    </Link>
                  </Button>
                ) : (
                  <Button disabled size="sm" variant="outline">
                    <ArrowLeft className="mr-2 size-4" />
                    Previous
                  </Button>
                )}

                <span className="text-sm font-medium text-on-surface-variant">
                  Page {currentPage} of {totalPages}
                </span>

                {currentPage < totalPages ? (
                  <Button asChild size="sm" variant="default">
                    <Link href={`/student/concept/${concept.conceptId}/learn?page=${currentPage + 1}`}>
                      Next
                      <ArrowRight className="ml-2 size-4" />
                    </Link>
                  </Button>
                ) : (
                  <Button disabled size="sm" variant="outline">
                    Finished
                    <CheckCircle2 className="ml-2 size-4 text-primary" />
                  </Button>
                )}
              </div>
            )}
          </article>

          {concept.chunks.length || concept.workedExamples.length ? (
            <article className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <ShieldCheck className="size-5 text-primary" />
                <h2 className="text-lg font-bold text-on-surface">Mastery path</h2>
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <PathStep icon={BookOpen} label="Lesson" value={`${concept.contentBlocks.length} blocks`} />
                <PathStep icon={PlayCircle} label="Media" value={hasVideo || hasSimulation ? "Available" : "Text focused"} />
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
          <TutorPanel
            conceptId={concept.conceptId}
            conceptTitle={concept.title}
            initialMessages={tutorMessages}
          />
        </aside>
      </div>
    </div>
  )
}

function ReadinessMetric({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof BookOpen
  label: string
  value: string
}) {
  return (
    <div className="rounded-lg border border-outline-variant/50 bg-muted p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <p className="mt-2 text-sm font-extrabold text-on-surface">{value}</p>
    </div>
  )
}

function MediaPill({ icon: Icon, label }: { icon: typeof ImageIcon; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-bold text-on-surface-variant">
      <Icon className="size-3.5 text-primary" />
      {label}
    </span>
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
