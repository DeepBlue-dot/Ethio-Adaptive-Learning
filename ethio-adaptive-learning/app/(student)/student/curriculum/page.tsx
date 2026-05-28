import Link from "next/link"
import {
  ArrowRight,
  BookOpen,
  Boxes,
  CheckCircle2,
  GraduationCap,
  ImageIcon,
  Layers3,
  LockKeyhole,
  PlayCircle,
  Sparkles,
  Target,
} from "lucide-react"

import {
  MasteryBar,
  StatusBadge,
  formatPercent,
} from "@/components/student/student-status"
import { Button } from "@/components/ui/button"
import { requireRole } from "@/lib/auth-server"
import { getStudentCurriculumExplore } from "@/lib/student/data"
import type { StudentCurriculumExplore } from "@/lib/student/types"
import { cn } from "@/lib/utils"

export default async function CurriculumPage() {
  const session = await requireRole("STUDENT")
  const curriculum = await getStudentCurriculumExplore(session.user.id)
  const masteryRatio = curriculum.summary.conceptCount
    ? curriculum.summary.masteredConcepts / curriculum.summary.conceptCount
    : 0

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="overflow-hidden rounded-lg border border-outline-variant/50 bg-surface-container-lowest shadow-sm">
        <div className="grid gap-0 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-md bg-primary-fixed px-3 py-1 text-xs font-bold text-on-primary-fixed">
                <GraduationCap className="size-3.5" />
                Course explorer
              </span>
              <span className="rounded-md bg-muted px-3 py-1 text-xs font-semibold text-on-surface-variant">
                {curriculum.summary.courseCount} courses
              </span>
            </div>
            <h1 className="mt-4 max-w-3xl text-3xl font-extrabold text-on-surface">
              Explore courses, units, and concepts before choosing your next move.
            </h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
              Scan the complete learning map, spot lessons with media and simulations, and jump straight into the concept that fits your readiness.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <HeroMetric icon={Layers3} label="Units" value={curriculum.summary.unitCount} />
              <HeroMetric icon={BookOpen} label="Concepts" value={curriculum.summary.conceptCount} />
              <HeroMetric icon={CheckCircle2} label="Unlocked" value={curriculum.summary.unlockedConcepts} />
              <HeroMetric icon={ImageIcon} label="Media assets" value={curriculum.summary.mediaAssets} />
            </div>
          </div>

          <div className="border-t border-outline-variant/50 bg-muted p-5 lg:border-l lg:border-t-0">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-on-surface">Curriculum mastery</p>
              <p className="text-3xl font-extrabold text-primary">{formatPercent(masteryRatio)}</p>
            </div>
            <MasteryBar className="mt-4" value={masteryRatio} />
            <div className="mt-5 grid grid-cols-2 gap-3">
              <SmallStat label="Mastered" value={curriculum.summary.masteredConcepts} />
              <SmallStat label="Available" value={curriculum.summary.unlockedConcepts} />
            </div>
          </div>
        </div>
      </section>

      <div className="space-y-8">
        {curriculum.courses.map((course) => (
          <CourseExplorer key={course.id} course={course} />
        ))}
      </div>
    </div>
  )
}

function CourseExplorer({ course }: { course: StudentCurriculumExplore["courses"][number] }) {
  const progress = course.totalConcepts ? course.masteredConcepts / course.totalConcepts : 0

  return (
    <section id={`course-${course.id}`} className="space-y-4 scroll-mt-20">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">{course.units.length} units</p>
          <h2 className="mt-1 text-2xl font-extrabold text-on-surface">{course.title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-on-surface-variant">
            {course.description ?? "A guided adaptive course with sequenced units and concept-level mastery."}
          </p>
        </div>
        <div className="w-full rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-4 sm:w-72">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-on-surface">Course progress</span>
            <span className="font-bold text-primary">{formatPercent(progress)}</span>
          </div>
          <MasteryBar className="mt-3" value={progress} />
        </div>
      </div>

      <div className="grid gap-5">
        {course.units.map((unit) => (
          <section
            key={unit.id}
            id={`unit-${unit.id}`}
            className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-4 shadow-sm scroll-mt-20"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase text-on-surface-variant">Unit {unit.order}</p>
                <h3 className="mt-1 text-xl font-extrabold text-on-surface">{unit.title}</h3>
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-semibold text-on-surface-variant">
                <span className="rounded-md bg-muted px-2 py-1">{unit.totalConcepts} concepts</span>
                <span className="rounded-md bg-muted px-2 py-1">{unit.unlockedConcepts} unlocked</span>
                <span className="rounded-md bg-muted px-2 py-1">{unit.masteredConcepts} mastered</span>
              </div>
            </div>

            <div className="mt-4 grid gap-4 xl:grid-cols-3">
              {unit.concepts.map((concept) => (
                <ConceptExploreCard key={concept.conceptId} concept={concept} />
              ))}
            </div>
          </section>
        ))}
      </div>
    </section>
  )
}

function ConceptExploreCard({
  concept,
}: {
  concept: StudentCurriculumExplore["courses"][number]["units"][number]["concepts"][number]
}) {
  const locked = concept.status === "LOCKED"

  return (
    <article
      className={cn(
        "flex min-h-[23rem] flex-col overflow-hidden rounded-lg border border-outline-variant/50 bg-background shadow-sm transition",
        locked ? "opacity-75" : "hover:border-primary/40"
      )}
    >
      <div
        className={cn(
          "relative flex h-32 items-end bg-surface-container-high p-4",
          !concept.imageUrl && "bg-[linear-gradient(135deg,var(--color-primary-fixed),var(--color-surface-container-high))]"
        )}
        style={
          concept.imageUrl
            ? {
                backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.68), rgba(0,0,0,0.08)), url(${concept.imageUrl})`,
                backgroundPosition: "center",
                backgroundSize: "cover",
              }
            : undefined
        }
      >
        <div className="flex w-full items-center justify-between gap-3">
          <StatusBadge status={concept.status} />
          <span className="rounded-md bg-background/90 px-2 py-1 text-xs font-bold text-on-surface">
            {formatPercent(concept.pMastery)}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-medium text-on-surface-variant">{concept.unit.title}</p>
            <h4 className="mt-1 text-base font-extrabold text-on-surface">{concept.title}</h4>
          </div>
          {locked ? <LockKeyhole className="size-4 shrink-0 text-on-surface-variant" /> : null}
        </div>
        <p className="mt-3 line-clamp-3 text-sm leading-6 text-on-surface-variant">
          {concept.description ?? "Build confidence with guided reading, adaptive practice, and a mastery check."}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <Tile icon={BookOpen} label="Blocks" value={concept.lessonBlockCount} />
          <Tile icon={Target} label="Questions" value={concept.questionCount} />
          <Tile icon={Boxes} label="Media" value={concept.mediaAssets} />
        </div>

        <div className="mt-3 flex flex-wrap gap-2">
          {concept.hasVideo ? <Chip icon={PlayCircle} label="Video" /> : null}
          {concept.hasSimulation ? <Chip icon={Sparkles} label="Simulation" /> : null}
          {concept.prerequisiteTitles.length ? <Chip icon={LockKeyhole} label={`${concept.prerequisiteTitles.length} prereq`} /> : null}
        </div>

        <div className="mt-auto pt-4">
          {locked ? (
            <Button className="w-full justify-between" disabled variant="outline">
              Locked
              <LockKeyhole className="size-4" />
            </Button>
          ) : (
            <Button asChild className="w-full justify-between">
              <Link href={`/student/concept/${concept.conceptId}`}>
                Explore concept
                <ArrowRight className="size-4" />
              </Link>
            </Button>
          )}
        </div>
      </div>
    </article>
  )
}

function HeroMetric({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number }) {
  return (
    <div className="rounded-lg border border-outline-variant/50 bg-muted p-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-on-surface-variant">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <p className="mt-2 text-xl font-extrabold text-on-surface">{value}</p>
    </div>
  )
}

function SmallStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md bg-background p-3">
      <p className="text-xs text-on-surface-variant">{label}</p>
      <p className="mt-1 text-lg font-bold text-on-surface">{value}</p>
    </div>
  )
}

function Tile({ icon: Icon, label, value }: { icon: typeof BookOpen; label: string; value: number }) {
  return (
    <div className="rounded-md bg-muted p-2">
      <div className="flex min-w-0 items-center gap-1 text-on-surface-variant">
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
      </div>
      <p className="mt-1 font-bold text-on-surface">{value}</p>
    </div>
  )
}

function Chip({ icon: Icon, label }: { icon: typeof PlayCircle; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-primary-fixed px-2 py-1 text-xs font-bold text-on-primary-fixed">
      <Icon className="size-3.5" />
      {label}
    </span>
  )
}
