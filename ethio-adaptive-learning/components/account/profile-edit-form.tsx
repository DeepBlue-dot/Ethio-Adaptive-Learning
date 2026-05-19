"use client"

import { useTransition, useState } from "react"
import { User, UserProfile } from "@prisma/client"
import { CheckCircle, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"

interface ProfileEditFormProps {
  user: User & { profile: UserProfile | null }
}

const GRADE_OPTIONS = [
  { value: "MIDDLE_SCHOOL", label: "Middle School" },
  { value: "GRADE_9", label: "Grade 9" },
  { value: "GRADE_10", label: "Grade 10" },
  { value: "GRADE_11", label: "Grade 11" },
  { value: "GRADE_12", label: "Grade 12" },
  { value: "ABOVE", label: "Above Grade 12" },
]

export function ProfileEditForm({ user }: ProfileEditFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [formData, setFormData] = useState({
    name: user.name || "",
    username: user.username || "",
    phoneNumber: user.phoneNumber || "",
    grade: user.grade || "",
  })

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
    setSuccess("")
  }

  const handleReset = () => {
    setFormData({
      name: user.name || "",
      username: user.username || "",
      phoneNumber: user.phoneNumber || "",
      grade: user.grade || "",
    })
    setError("")
    setSuccess("")
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Basic validation
    if (!formData.username.trim()) {
      setError("Username is required")
      return
    }

    if (formData.username.trim().length < 3) {
      setError("Username must be at least 3 characters")
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/account/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Failed to update profile")
          return
        }

        setSuccess("Profile updated successfully")
        setFormData({
          name: data.name || "",
          username: data.username || "",
          phoneNumber: data.phoneNumber || "",
          grade: data.grade || "",
        })
      } catch (err) {
        setError("An error occurred while updating your profile")
        console.error(err)
      }
    })
  }

  const handleVerifyEmail = () => {
    startTransition(async () => {
      try {
        const response = await fetch("/api/account/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Failed to request email verification")
          return
        }

        setSuccess("Verification email has been sent. Check your inbox!")
      } catch (err) {
        setError("Failed to request email verification")
        console.error(err)
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
                Email status
              </p>
              <h2 className="mt-3 text-xl font-semibold text-foreground">
                {user.emailVerified ? "Email verified" : "Confirm your email"}
              </h2>
              <p className="mt-2 text-sm text-muted-foreground">
                {user.emailVerified
                  ? "Your email is verified. Your account is fully secure."
                  : "Verify your email to activate notifications and secure your account."}
              </p>
            </div>
            <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
              user.emailVerified
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700"
            }`}>
              {user.emailVerified ? <CheckCircle className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
              {user.emailVerified ? "Verified" : "Unverified"}
            </div>
          </div>

          {!user.emailVerified && (
            <div className="mt-6 rounded-3xl bg-slate-50 p-5 text-sm text-slate-700 dark:bg-slate-900/80 dark:text-slate-200">
              <p className="font-medium">Finish your account setup</p>
              <p className="mt-2">Request a verification email so we can keep your account secure.</p>
            </div>
          )}

          {!user.emailVerified && (
            <div className="mt-6">
              <Button type="button" onClick={handleVerifyEmail} disabled={isPending}>
                {isPending ? "Sending verification..." : "Send verification email"}
              </Button>
            </div>
          )}
        </div>

        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-teal-700">
            Account snapshot
          </p>
          <div className="mt-6 grid gap-4">
            <div className="rounded-3xl bg-secondary p-5">
              <p className="text-sm text-muted-foreground">Full name</p>
              <p className="mt-2 text-base font-semibold text-foreground">{user.name || "Not set"}</p>
            </div>
            <div className="rounded-3xl bg-secondary p-5">
              <p className="text-sm text-muted-foreground">Grade</p>
              <p className="mt-2 text-base font-semibold text-foreground">{user.grade || "Not selected"}</p>
            </div>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
          {error && (
            <div className="mb-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-6 rounded-2xl border border-emerald-300/70 bg-emerald-50 p-4">
              <p className="text-sm text-emerald-700">{success}</p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-5">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-gray-700 dark:bg-slate-800/60 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="username" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Username *
                </label>
                <input
                  type="text"
                  id="username"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="johndoe"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-gray-700 dark:bg-slate-800/60 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  placeholder="+251 9 99 99 99 99"
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-gray-700 dark:bg-slate-800/60 dark:text-white"
                />
              </div>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="grade" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Grade / Level
                </label>
                <select
                  id="grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-gray-700 dark:bg-slate-800/60 dark:text-white"
                >
                  <option value="">Select a grade</option>
                  {GRADE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email (Read-only)
                </label>
                <input
                  type="email"
                  id="email"
                  value={user.email}
                  disabled
                  className="mt-2 w-full rounded-2xl border border-gray-200 bg-gray-100 px-4 py-3 text-sm text-slate-600 dark:border-gray-700 dark:bg-slate-900/50 dark:text-slate-500"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
            <Button variant="outline" type="button" onClick={handleReset}>
              Reset
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
