"use client"

import Link from "next/link"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

type SubmitStatus = "idle" | "pending" | "success"

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<SubmitStatus>("idle")
  const [isPending, startTransition] = useTransition()

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const payload = {
          email: String(formData.get("email") ?? "").trim().toLowerCase(),
        }

        startTransition(async () => {
          setError(null)
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

      <Button className="h-11 w-full rounded-xl text-sm" type="submit" disabled={isPending || status === "success"}>
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
