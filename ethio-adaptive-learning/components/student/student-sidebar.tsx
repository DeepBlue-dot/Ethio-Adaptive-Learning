"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  Flame,
  Gauge,
  GraduationCap,
  Home,
  RotateCcw,
  Settings,
} from "lucide-react"

import { cn } from "@/lib/utils"
import type { StudentNavigation } from "@/lib/student/types"
import { MasteryBar, StatusBadge, formatPercent } from "@/components/student/student-status"

type StudentSidebarProps = {
  navigation: StudentNavigation
}

const navLinks = [
  { href: "/student", label: "Dashboard", icon: Home },
  { href: "/student/reviews", label: "Review Queue", icon: RotateCcw },
  { href: "/student#curriculum", label: "Curriculum", icon: BookOpen },
  { href: "/student#analytics", label: "Analytics", icon: BarChart3 },
]

export function StudentSidebar({ navigation }: StudentSidebarProps) {
  const pathname = usePathname()
  const progress =
    navigation.summary.totalConcepts > 0
      ? navigation.summary.masteredConcepts / navigation.summary.totalConcepts
      : 0

  return (
    <nav className="fixed left-0 top-0 z-40 hidden h-full w-72 flex-col border-r border-outline-variant/40 bg-surface-container-low px-4 py-5 shadow-sm lg:flex">
      <Link className="flex items-center gap-3 px-2" href="/student">
        <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <GraduationCap className="size-5" />
        </span>
        <span>
          <span className="block text-lg font-extrabold text-primary">EthioPrep AI</span>
          <span className="block text-xs font-medium text-on-surface-variant">Adaptive learning</span>
        </span>
      </Link>

      <div className="mt-6 rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-on-surface">{navigation.profile.username}</p>
            <p className="text-xs text-on-surface-variant">Grade 12 learner</p>
          </div>
          <span className="rounded-md bg-primary-fixed px-2 py-1 text-xs font-semibold text-on-primary-fixed">
            Level {navigation.profile.currentLevel}
          </span>
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-on-surface-variant">
            <span>Curriculum mastery</span>
            <span>{formatPercent(progress)}</span>
          </div>
          <MasteryBar value={progress} />
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-md bg-muted p-2">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <Gauge className="size-3.5" />
              XP
            </div>
            <p className="mt-1 font-semibold text-on-surface">{navigation.profile.totalXP}</p>
          </div>
          <div className="rounded-md bg-muted p-2">
            <div className="flex items-center gap-1.5 text-on-surface-variant">
              <Flame className="size-3.5" />
              Streak
            </div>
            <p className="mt-1 font-semibold text-on-surface">{navigation.profile.dailyStreak} days</p>
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-1">
        {navLinks.map((link) => {
          const isHashLink = link.href.includes("#")
          const isActive =
            !isHashLink &&
            (link.href === "/student" ? pathname === "/student" : pathname.startsWith(link.href))
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition",
                isActive
                  ? "bg-primary-fixed text-on-primary-fixed"
                  : "text-on-surface-variant hover:bg-surface-container-high hover:text-on-surface"
              )}
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          )
        })}
      </div>

      <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
        <p className="px-2 text-xs font-semibold text-on-surface-variant">Course map</p>
        <div className="mt-3 space-y-4">
          {navigation.courses.map((course) => (
            <div key={course.id} className="space-y-3">
              <p className="px-2 text-sm font-bold text-on-surface">{course.title}</p>
              {course.units.map((unit) => (
                <div key={unit.id} className="space-y-1">
                  <p className="px-2 text-xs font-medium text-on-surface-variant">{unit.title}</p>
                  {unit.concepts.slice(0, 5).map((concept) => (
                    <Link
                      key={concept.id}
                      className={cn(
                        "block rounded-lg border border-transparent px-2 py-2 transition hover:border-outline-variant hover:bg-surface-container-high",
                        pathname === concept.href && "border-primary/30 bg-primary-fixed/40"
                      )}
                      href={concept.href}
                    >
                      <span className="line-clamp-1 text-xs font-semibold text-on-surface">
                        {concept.title}
                      </span>
                      <StatusBadge className="mt-1 h-6 text-[11px]" status={concept.status} />
                    </Link>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 border-t border-outline-variant/50 pt-3">
        <Link
          href="/account"
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface"
        >
          <Settings className="size-4" />
          Profile settings
        </Link>
      </div>
    </nav>
  )
}
