import Link from "next/link"
import {
  BookMarked,
  ClipboardList,
  Database,
  FileText,
  Network,
  Sparkles,
  Users,
} from "lucide-react"

import { requireRole } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export default async function AdminDashboardPage() {
  const session = await requireRole(["ADMIN", "COURSE_WRITER"])
  const isAdmin = session.user.role === "ADMIN"
  const isWriter = session.user.role === "COURSE_WRITER"

  const [userCount, courseCount, conceptCount, questionCount, authoredCourseCount, authoredQuestionCount, authoredChunkCount, authoredExampleCount] =
    await Promise.all([
      isAdmin ? prisma.user.count() : Promise.resolve(0),
      prisma.course.count(),
      prisma.concept.count(),
      prisma.question.count(),
      isWriter ? prisma.course.count({ where: { authorId: session.user.id } }) : Promise.resolve(0),
      isWriter ? prisma.question.count({ where: { authorId: session.user.id } }) : Promise.resolve(0),
      isWriter ? prisma.conceptChunk.count({ where: { authorId: session.user.id } }) : Promise.resolve(0),
      isWriter ? prisma.workedExample.count({ where: { authorId: session.user.id } }) : Promise.resolve(0),
    ])

  const summaryCards = isAdmin
    ? [
        { label: "Users", value: userCount, description: "Active platform accounts", icon: Users },
        { label: "Courses", value: courseCount, description: "Curriculum offerings", icon: BookMarked },
        { label: "Concepts", value: conceptCount, description: "Knowledge nodes in the system", icon: Network },
        { label: "Questions", value: questionCount, description: "Assessment items available", icon: Database },
      ]
    : [
        { label: "My courses", value: authoredCourseCount, description: "Courses you authored", icon: BookMarked },
        { label: "My questions", value: authoredQuestionCount, description: "Questions you authored", icon: ClipboardList },
        { label: "Concept blocks", value: authoredChunkCount, description: "Lesson chunks you created", icon: FileText },
        { label: "Worked examples", value: authoredExampleCount, description: "Supporting examples authored", icon: Sparkles },
      ]

  const actionCards = isAdmin
    ? [
        {
          title: "Manage users",
          description: "Review platform roles, invite administrators, and keep the learner base in sync.",
          href: "/admin/users",
          icon: Users,
          badge: "Admin",
        },
        {
          title: "Global CMS",
          description: "Create and maintain all content types through the shared CMS framework.",
          href: "/admin/cms",
          icon: Network,
          badge: "Curriculum",
        },
        {
          title: "Question bank",
          description: "Author checkpoint and exam items, or review questions created by the team.",
          href: "/admin/cms/question",
          icon: BookMarked,
          badge: "Assessment",
        },
      ]
    : [
        {
          title: "Create content",
          description: "Build curriculum content using the shared CMS type registry.",
          href: "/admin/cms",
          icon: FileText,
          badge: "Author",
        },
        {
          title: "Add questions",
          description: "Write practice and checkpoint questions that strengthen mastery paths.",
          href: "/admin/cms/question",
          icon: ClipboardList,
          badge: "Assessment",
        },
        {
          title: "Review authored work",
          description: "Track your latest authored items and refine them for student use.",
          href: "/admin/cms/concept",
          icon: Sparkles,
          badge: "Drafts",
        },
      ]

  return (
    <div className="space-y-8">
      <section className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
              {isAdmin ? "Platform administration" : "Course writer workspace"}
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight text-foreground">
              {isAdmin ? "Manage platform operations and curriculum governance." : "Author curriculum content and assessment items."}
            </h1>
            <p className="mt-4 text-base leading-7 text-muted-foreground">
              {isAdmin
                ? "Monitor adoption, manage users, and keep the content pipeline healthy across the CMS." 
                : "Create courses, concepts, and questions with author-centric workflows tailored for course writers."}
            </p>
          </div>
          <div className="hidden xl:block rounded-3xl bg-secondary p-6 text-center text-sm text-secondary-foreground">
            <p className="font-semibold">Signed in as</p>
            <p className="mt-2 text-2xl font-semibold text-foreground">{session.user.username}</p>
            <p className="mt-1 uppercase tracking-[0.2em] text-xs">{session.user.role.replace("_", " ")}</p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map(({ label, value, description, icon: Icon }) => (
            <div key={label} className="rounded-3xl bg-secondary p-5">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">{label}</p>
                <div className="rounded-2xl bg-white/80 p-3 text-secondary-foreground">
                  <Icon className="size-5" />
                </div>
              </div>
              <p className="mt-5 text-3xl font-semibold">{value}</p>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {actionCards.map(({ title, description, href, icon: Icon, badge }) => (
          <Link
            key={title}
            href={href}
            className="block rounded-[2rem] border border-border bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-teal-700">{badge}</p>
                <h2 className="mt-3 text-2xl font-semibold text-foreground">{title}</h2>
              </div>
              <div className="rounded-2xl bg-secondary p-3 text-secondary-foreground">
                <Icon className="size-5" />
              </div>
            </div>
            <p className="mt-5 text-base leading-7 text-muted-foreground">{description}</p>
          </Link>
        ))}
      </section>
    </div>
  )
}
