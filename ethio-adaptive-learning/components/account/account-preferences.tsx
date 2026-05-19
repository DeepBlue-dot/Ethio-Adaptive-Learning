"use client"

import { User, UserProfile } from "@prisma/client"
import { Zap, Flame, Calendar, LogIn } from "lucide-react"

import { ThemeToggle } from "@/components/theme-toggle"

interface AccountPreferencesProps {
  user: User
  profile: UserProfile | null
}

export function AccountPreferences({ user, profile }: AccountPreferencesProps) {
  const formatDate = (date: Date | null) => {
    if (!date) return "Never"
    return new Intl.DateTimeFormat("en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(date))
  }

  const stats = [
    {
      icon: Zap,
      label: "Current Level",
      value: profile?.currentLevel ?? 1,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      icon: Flame,
      label: "Daily Streak",
      value: `${profile?.dailyStreak ?? 0} days`,
      color: "text-amber-600",
      bgColor: "bg-amber-50 dark:bg-amber-900/20",
    },
    {
      icon: Calendar,
      label: "Total XP",
      value: (profile?.totalXP ?? 0).toLocaleString(),
      color: "text-emerald-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-900/20",
    },
    {
      icon: LogIn,
      label: "Last Login",
      value: formatDate(profile?.lastLogin ?? null),
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
      isSmall: true,
    },
  ]

  return (
    <div className="space-y-6">
      {/* Learning Stats */}
      <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Learning Progress</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Your progress and activity summaries are shown here.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            Keep your momentum going
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat, idx) => {
            const Icon = stat.icon
            return (
              <div
                key={idx}
                className={`rounded-3xl ${stat.bgColor} border border-border/50 p-6 shadow-sm`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.label}
                    </p>
                    <p
                      className={`mt-3 text-2xl font-semibold ${stat.color} ${
                        stat.isSmall ? "text-base" : ""
                      }`}
                    >
                      {stat.value}
                    </p>
                  </div>
                  <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-slate-900 shadow-sm dark:bg-slate-950 dark:text-slate-100">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Overall Progress */}
      {profile && (
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Overall Progress
          </h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                Completion
              </span>
              <span className="text-sm font-semibold text-foreground">
                {Math.round(profile.overallProgress)}%
              </span>
            </div>
            <div className="h-3 rounded-full bg-gray-200 overflow-hidden dark:bg-slate-700">
              <div
                className="h-full bg-linear-to-r from-blue-600 to-blue-400 transition-all duration-300"
                style={{ width: `${profile.overallProgress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Preferences Section */}
      <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">
          Display Preferences
        </h2>

        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium text-foreground">Dark Mode</p>
            <p className="text-sm text-muted-foreground">
              Toggle dark theme for better visibility
            </p>
          </div>
          <ThemeToggle />
        </div>
      </div>

      {/* Account Info Summary */}
      <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <h2 className="mb-6 text-lg font-semibold text-foreground">
          Account Summary
        </h2>

        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <span className="text-sm text-muted-foreground">Username</span>
            <span className="font-medium text-foreground">{user.username}</span>
          </div>

          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <span className="text-sm text-muted-foreground">Email</span>
            <div className="text-right">
              <p className="font-medium text-foreground">{user.email}</p>
              <p className="text-xs text-muted-foreground">
                {user.emailVerified
                  ? "✓ Verified"
                  : "Pending verification"}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-border/50 pb-4">
            <span className="text-sm text-muted-foreground">Member Since</span>
            <span className="font-medium text-foreground">
              {formatDate(user.createdAt)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Account Role</span>
            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-200">
              {user.role}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
