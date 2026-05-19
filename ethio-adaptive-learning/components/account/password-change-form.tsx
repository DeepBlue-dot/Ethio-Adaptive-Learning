"use client"

import { useTransition, useState } from "react"
import { Eye, EyeOff } from "lucide-react"

import { Button } from "@/components/ui/button"

export function PasswordChangeForm() {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string>("")
  const [success, setSuccess] = useState<string>("")
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  })
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    setError("")
    setSuccess("")
  }

  const togglePasswordVisibility = (
    field: "current" | "new" | "confirm"
  ) => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }))
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (password.length >= 12) strength++
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++
    if (/\d/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    return {
      score: strength,
      label: ["Weak", "Fair", "Good", "Strong", "Very Strong"][strength] || "Weak",
      color:
        strength === 0
          ? "bg-destructive"
          : strength === 1
            ? "bg-amber-500"
            : strength === 2
              ? "bg-yellow-500"
              : strength === 3
                ? "bg-lime-500"
                : "bg-emerald-600",
    }
  }

  const passwordStrength = getPasswordStrength(formData.newPassword)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess("")

    // Validation
    if (!formData.currentPassword) {
      setError("Current password is required")
      return
    }

    if (!formData.newPassword) {
      setError("New password is required")
      return
    }

    if (formData.newPassword.length < 8) {
      setError("Password must be at least 8 characters")
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.currentPassword === formData.newPassword) {
      setError("New password must be different from current password")
      return
    }

    startTransition(async () => {
      try {
        const response = await fetch("/api/account/password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
            confirmPassword: formData.confirmPassword,
          }),
        })

        const data = await response.json()

        if (!response.ok) {
          setError(data.error || "Failed to change password")
          return
        }

        setSuccess("Password changed successfully")
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        })
      } catch (err) {
        setError("An error occurred while changing your password")
        console.error(err)
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-[2rem] border border-border bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-500">
              Security
            </p>
            <h2 className="mt-2 text-xl font-semibold text-foreground">
              Change password
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Update your password regularly to keep your account safe.
            </p>
          </div>
          <div className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-700 dark:bg-slate-900 dark:text-slate-200">
            Strong passwords protect your progress
          </div>
        </div>

        {error && (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="mt-6 rounded-2xl border border-emerald-300/70 bg-emerald-50 p-4">
            <p className="text-sm text-emerald-700">{success}</p>
          </div>
        )}

        <div className="mt-8 grid gap-6">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Current Password
            </label>
            <div className="relative mt-2">
              <input
                type={showPasswords.current ? "text" : "password"}
                id="currentPassword"
                name="currentPassword"
                value={formData.currentPassword}
                onChange={handleChange}
                placeholder="Enter current password"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-gray-700 dark:bg-slate-800/60 dark:text-white"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("current")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              New Password
            </label>
            <div className="relative mt-2">
              <input
                type={showPasswords.new ? "text" : "password"}
                id="newPassword"
                name="newPassword"
                value={formData.newPassword}
                onChange={handleChange}
                placeholder="Create a strong password"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-gray-700 dark:bg-slate-800/60 dark:text-white"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("new")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>

            {formData.newPassword && (
              <div className="mt-4 rounded-3xl border border-border/70 bg-slate-50 p-4 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-300">
                <div className="flex items-center justify-between">
                  <span>Password Strength</span>
                  <span className={`font-semibold ${
                    passwordStrength.color === "bg-destructive"
                      ? "text-destructive"
                      : passwordStrength.color === "bg-amber-500"
                        ? "text-amber-600"
                        : passwordStrength.color === "bg-yellow-500"
                          ? "text-yellow-600"
                          : passwordStrength.color === "bg-lime-500"
                            ? "text-lime-600"
                            : "text-emerald-600"
                  }`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="mt-3 h-2.5 rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-slate-700 dark:text-slate-200"
            >
              Confirm Password
            </label>
            <div className="relative mt-2">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                placeholder="Confirm your new password"
                className="w-full rounded-2xl border border-gray-200 bg-gray-50 px-4 py-3 pr-10 text-sm focus:border-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-gray-700 dark:bg-slate-800/60 dark:text-white"
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility("confirm")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" type="button" onClick={() => setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" })}>
            Clear
          </Button>
          <Button type="submit" disabled={isPending}>
            {isPending ? "Updating..." : "Change Password"}
          </Button>
        </div>
      </div>
    </form>
  )
}
