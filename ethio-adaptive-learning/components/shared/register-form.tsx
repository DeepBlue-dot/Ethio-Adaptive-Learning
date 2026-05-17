"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState, useTransition, useRef, useEffect } from "react"
import ReCAPTCHA from "react-google-recaptcha"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function RegisterForm() {
  const router = useRouter()
  const { theme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [error, setError] = useState<string | null>(null)
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

        const formData = new FormData(event.currentTarget)
        const payload = {
          username: String(formData.get("username") ?? "").trim(),
          email: String(formData.get("email") ?? "").trim(),
          password: String(formData.get("password") ?? ""),
          recaptchaToken: recaptchaRef.current?.getValue() ?? "",
        }

        startTransition(async () => {
          setError(null)

          const response = await fetch("/api/auth/register", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })

          const data = (await response.json()) as { error?: string }

          if (!response.ok) {
            setError(data.error ?? "Unable to create your account right now.")
            recaptchaRef.current?.reset()
            return
          }

          router.push("/login?registered=1")
          router.refresh()
        })
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          type="text"
          autoComplete="username"
          className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          placeholder="yeabsira12"
          minLength={3}
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="email">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          placeholder="student@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          className="w-full rounded-xl border border-gray-200 bg-white/80 px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-100"
          placeholder="Choose a strong password"
          minLength={8}
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

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button
        className="h-11 w-full rounded-xl text-sm bg-gradient-to-r from-blue-600 to-emerald-500 text-white shadow-lg transform transition-all hover:scale-105"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Creating account..." : "Create Student Account"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  )
}
