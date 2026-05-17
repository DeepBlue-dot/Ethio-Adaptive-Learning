"use client"

import Link from "next/link"
import { useState, useTransition, useRef, useEffect } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

type ResetPasswordFormProps = {
  initialEmail?: string
  initialToken?: string
}

type SubmitStatus = "idle" | "pending" | "success"

export function ResetPasswordForm({ initialEmail, initialToken }: ResetPasswordFormProps) {
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [email, setEmail] = useState(initialEmail ?? "")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<SubmitStatus>("idle")
  const [isPending, startTransition] = useTransition()
  const recaptchaRef = useRef<ReCAPTCHA>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()

        if (password !== confirmPassword) {
          setError("Passwords do not match.")
          return
        }

        const formData = new FormData(event.currentTarget)
        const payload = {
          email: String(formData.get("email") ?? "").trim().toLowerCase(),
          password: String(formData.get("password") ?? ""),
          token: initialToken,
          recaptchaToken: recaptchaRef.current?.getValue() ?? "",
        }

        startTransition(async () => {
          setError(null)
          setStatus("pending")

          if (payload.password.length < 8) {
            setStatus("idle")
            setError("Password must be at least 8 characters long.")
            return
          }

          const response = await fetch("/api/auth/reset-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })

          const data = (await response.json()) as { error?: string }

          if (!response.ok) {
            setStatus("idle")
            setError(data.error ?? "Unable to reset your password.")
            recaptchaRef.current?.reset()
            return
          }

          setStatus("success")
        })
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="email">
          Email address
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
          placeholder="student@example.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="password">
          New password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
          placeholder="Choose a new password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="confirmPassword">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
          placeholder="Repeat your new password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          required
        />
      </div>

      <div className="flex justify-center py-2">
        {mounted && (
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY!}
            theme={theme === "dark" ? "dark" : "light"}
          />
        )}
      </div>

      {initialToken ? (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          Reset token detected. Your password will be updated once you submit this form.
        </p>
      ) : (
        <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
          If you received a reset link, use the same email address and choose a secure password.
        </p>
      )}

      {status === "success" ? (
        <div className="rounded-xl border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Your password was updated successfully. You can now sign in with your new password.
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button className="h-11 w-full rounded-xl text-sm" type="submit" disabled={isPending || status === "success"}>
        {isPending ? "Updating password..." : "Reset password"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Back to{' '}
        <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  )
}
