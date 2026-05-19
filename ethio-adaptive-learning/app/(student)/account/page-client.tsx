"use client"

import { useState } from "react"
import { User, UserProfile } from "@prisma/client"
import { Activity, ShieldCheck, Settings, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import { AccountPreferences } from "@/components/account/account-preferences"
import { PasswordChangeForm } from "@/components/account/password-change-form"
import { ProfileEditForm } from "@/components/account/profile-edit-form"

type TabType = "profile" | "security" | "preferences"

interface AccountPageProps {
  user: User & { profile: UserProfile | null }
}

const tabs = [
  { id: "profile", label: "Profile", icon: <Sparkles className="h-4 w-4" /> },
  { id: "security", label: "Security", icon: <ShieldCheck className="h-4 w-4" /> },
  { id: "preferences", label: "Preferences", icon: <Settings className="h-4 w-4" /> },
] as const

export default function AccountPageContent({ user }: AccountPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("profile")

  return (
    <div className="space-y-6">
      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
                Account Settings
              </p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                Manage your student profile
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                Update your account, security, and learning preferences in one polished workspace.
              </p>
            </div>
            <div className="rounded-3xl border border-border bg-secondary/70 p-4 text-sm text-slate-700 shadow-sm dark:bg-slate-900/70 dark:text-slate-200">
              <p className="font-medium text-slate-900 dark:text-slate-100">Quick snapshot</p>
              <div className="mt-3 grid gap-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Username</span>
                  <span className="font-semibold">{user.username}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Grade</span>
                  <span className="font-semibold">{user.grade ?? "N/A"}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[0.7rem] font-semibold text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-900/10 dark:text-emerald-300">
                    <Activity className="h-3.5 w-3.5" /> Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-border bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Email</p>
              <p className="mt-3 text-sm font-medium text-foreground truncate">{user.email}</p>
            </div>
            <div className="rounded-3xl border border-border bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Role</p>
              <p className="mt-3 text-sm font-medium text-foreground">{user.role}</p>
            </div>
            <div className="rounded-3xl border border-border bg-slate-50 p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">Verified</p>
              <p className="mt-3 text-sm font-medium text-foreground">{user.emailVerified ? "Yes" : "Not yet"}</p>
            </div>
          </div>
        </div>

        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
          <div className="space-y-6">
            <div className="rounded-[1.75rem] bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 px-5 py-6 text-white shadow-lg shadow-slate-900/10">
              <p className="text-sm uppercase tracking-[0.35em] text-slate-300">Need help?</p>
              <h2 className="mt-2 text-2xl font-semibold">Secure your account</h2>
              <p className="mt-3 text-sm text-slate-300">
                Use strong passwords and keep your profile info current to stay ahead.
              </p>
            </div>
            <div className="grid gap-4">
              <div className="rounded-3xl border border-border bg-secondary p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">Next recommended action</p>
                <p className="mt-3 text-sm leading-6 text-foreground">
                  Verify your email and ensure your phone number is correct.
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-secondary p-5">
                <p className="text-sm font-semibold uppercase tracking-[0.25em] text-muted-foreground">Pro tip</p>
                <p className="mt-3 text-sm leading-6 text-foreground">
                  Choose a unique password and update it regularly for better security.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">Account tabs</p>
            <p className="text-sm text-muted-foreground">Switch between your profile, security, and preferences.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "secondary" : "outline"}
                size="sm"
                onClick={() => setActiveTab(tab.id)}
                className="gap-2"
              >
                {tab.icon}
                {tab.label}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <div>
        {activeTab === "profile" && <ProfileEditForm user={user} />}
        {activeTab === "security" && <PasswordChangeForm />}
        {activeTab === "preferences" && <AccountPreferences user={user} profile={user.profile} />}
      </div>
    </div>
  )
}
