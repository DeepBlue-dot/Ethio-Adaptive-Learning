import Link from "next/link"
import { BookOpen, Flame, Gauge, RotateCcw } from "lucide-react"

import { SignOutButton } from "@/components/shared/sign-out-button"
import { StudentMobileNav } from "@/components/student/student-mobile-nav"
import { Button } from "@/components/ui/button"
import type { StudentNavigation } from "@/lib/student/types"
import { formatPercent } from "@/components/student/student-status"

export function StudentHeader({ navigation }: { navigation: StudentNavigation }) {
  const progress =
    navigation.summary.totalConcepts > 0
      ? navigation.summary.masteredConcepts / navigation.summary.totalConcepts
      : 0

  return (
    <header className="sticky top-0 z-30 border-b border-outline-variant/40 bg-background/90 backdrop-blur-xl">
      <div className="flex min-h-16 items-center justify-between gap-4 px-4 py-3 lg:px-8">
        <div className="flex items-center gap-3">
          <StudentMobileNav navigation={navigation} />
          <div>
            <p className="text-sm font-semibold text-on-surface">Student workspace</p>
            <p className="text-xs text-on-surface-variant">
              {navigation.summary.unlockedConcepts} available of {navigation.summary.totalConcepts} concepts
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-2 md:flex">
          <HeaderStat icon={Gauge} label="Level" value={String(navigation.profile.currentLevel)} />
          <HeaderStat icon={BookOpen} label="Progress" value={formatPercent(progress)} />
          <HeaderStat icon={Flame} label="Streak" value={`${navigation.profile.dailyStreak}d`} />
          <Button asChild size="sm" variant="outline">
            <Link href="/student/reviews">
              <RotateCcw className="size-4" />
              {navigation.summary.reviewDue} due
            </Link>
          </Button>
        </div>

        <SignOutButton />
      </div>
    </header>
  )
}

function HeaderStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Gauge
  label: string
  value: string
}) {
  return (
    <div className="flex h-9 items-center gap-2 rounded-lg border border-outline-variant/50 bg-surface-container-lowest px-3">
      <Icon className="size-4 text-primary" />
      <span className="text-xs font-medium text-on-surface-variant">{label}</span>
      <span className="text-sm font-semibold text-on-surface">{value}</span>
    </div>
  )
}
