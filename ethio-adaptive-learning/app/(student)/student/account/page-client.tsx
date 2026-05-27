"use client"

import { useState } from "react"
import { User, UserProfile } from "@prisma/client"
import {
  Activity,
  Mail,
  Phone,
  ShieldCheck,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react"

import { AccountPreferences } from "@/components/account/account-preferences"
import { PasswordChangeForm } from "@/components/account/password-change-form"
import { ProfileEditForm } from "@/components/account/profile-edit-form"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

type TabType = "profile" | "security" | "preferences"

interface AccountPageProps {
  user: User & { profile: UserProfile | null }
}

const tabs = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "preferences", label: "Preferences", icon: Settings },
] as const

export default function AccountPageContent({ user }: AccountPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>("profile")

  return (
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
      <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-5 shadow-sm">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <div>
            <p className="text-sm font-semibold text-primary">Account</p>
            <h1 className="mt-2 text-3xl font-extrabold text-on-surface">Student profile</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-on-surface-variant">
              Manage identity, security, display preferences, and the learning stats tied to your account.
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <Snapshot icon={Sparkles} label="Username" value={user.username} />
              <Snapshot icon={Activity} label="Grade" value={user.grade?.replaceAll("_", " ") ?? "Not set"} />
              <Snapshot icon={ShieldCheck} label="Status" value={user.emailVerified ? "Verified" : "Pending"} />
            </div>
          </div>

          <div className="rounded-lg border border-outline-variant/50 bg-muted p-4">
            <p className="text-sm font-semibold text-on-surface">Contact snapshot</p>
            <div className="mt-4 space-y-3 text-sm">
              <ContactRow icon={Mail} label="Email" value={user.email} />
              <ContactRow icon={Phone} label="Phone" value={user.phoneNumber ?? "Not set"} />
              <ContactRow icon={UserRound} label="Role" value={user.role} />
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-lg border border-outline-variant/50 bg-surface-container-lowest p-3 shadow-sm">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = activeTab === tab.id

            return (
              <Button
                key={tab.id}
                className={cn("gap-2", isActive && "shadow-sm")}
                onClick={() => setActiveTab(tab.id)}
                size="sm"
                type="button"
                variant={isActive ? "default" : "outline"}
              >
                <Icon className="size-4" />
                {tab.label}
              </Button>
            )
          })}
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

function Snapshot({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Sparkles
  label: string
  value: string
}) {
  return (
    <div className="min-w-0 rounded-lg border border-outline-variant/50 bg-muted p-3">
      <div className="flex items-center gap-2 text-xs font-medium text-on-surface-variant">
        <Icon className="size-4 text-primary" />
        {label}
      </div>
      <p className="mt-2 truncate text-sm font-bold text-on-surface">{value}</p>
    </div>
  )
}

function ContactRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Mail
  label: string
  value: string
}) {
  return (
    <div className="flex min-w-0 items-center justify-between gap-3 rounded-md bg-background p-3">
      <div className="flex min-w-0 items-center gap-2 text-on-surface-variant">
        <Icon className="size-4 shrink-0 text-primary" />
        <span className="text-xs">{label}</span>
      </div>
      <span className="truncate text-right text-sm font-semibold text-on-surface">{value}</span>
    </div>
  )
}
