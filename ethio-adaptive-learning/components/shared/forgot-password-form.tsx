"use client"

import Link from "next/link"
import ReCAPTCHA from "react-google-recaptcha"
import { useRef, useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

type SubmitStatus = "idle" | "pending" | "success"

export function ForgotPasswordForm() {
  const recaptchaRef = useRef<ReCAPTCHA | null>(null)
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [captchaError, setCaptchaError] = useState<string | null>(null)
  const [recaptchaToken, setRecaptchaToken] = useState<string | null>(null)
  const [status, setStatus] = useState<SubmitStatus>("idle")
  const [isPending, startTransition] = useTransition()
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? ""

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const payload = {
          email: String(formData.get("email") ?? "").trim().toLowerCase(),
          recaptchaToken,
        }

        if (!recaptchaToken) {
          setCaptchaError("Please complete the CAPTCHA verification.")
          return
        }

        startTransition(async () => {
          setError(null)
          setCaptchaError(null)
          setStatus("pending")

          const response = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          })

          const data = (await response.json()) as { error?: string }

          if (!response.ok) {
            setStatus("idle")
            setError(data.error ?? "Unable to submit your request.")
            return
          }

          setStatus("success")
          recaptchaRef.current?.reset()
          setRecaptchaToken(null)
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

      <div className="space-y-3">
        {siteKey ? (
          <ReCAPTCHA
            ref={recaptchaRef}
            sitekey={siteKey}
            onChange={(token) => {
              setRecaptchaToken(token)
              setCaptchaError(null)
            }}
            onExpired={() => {
              setRecaptchaToken(null)
              setCaptchaError("reCAPTCHA expired. Please try again.")
            }}
            theme="light"
          />
        ) : (
          <p className="rounded-xl border border-yellow-300/70 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
            CAPTCHA is not configured. Please check your environment settings.
          </p>
        )}

        {captchaError ? (
          <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {captchaError}
          </p>
        ) : null}
      </div>

      {status === "success" ? (
        <div className="rounded-xl border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          If an account exists for that email, we&apos;ll send a reset link with next steps.
        </div>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

<Button
          className="h-11 w-full rounded-xl text-sm"
          type="submit"
          disabled={isPending || status === "success" || !recaptchaToken}
        >
        {isPending ? "Sending request..." : "Send reset instructions"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Remembered your password?{' '}
        <Link className="font-medium text-foreground underline underline-offset-4" href="/login">
          Sign in
        </Link>
      </p>
    </form>
  )
}
