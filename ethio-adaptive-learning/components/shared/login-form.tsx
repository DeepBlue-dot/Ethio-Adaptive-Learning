"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { signIn } from "next-auth/react"
import { useState, useTransition } from "react"

import { Button } from "@/components/ui/button"

type LoginFormProps = {
  registered?: boolean
}

export function LoginForm({ registered = false }: LoginFormProps) {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  return (
    <form
      className="space-y-5"
      onSubmit={(event) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const identifier = String(formData.get("identifier") ?? "").trim()
        const password = String(formData.get("password") ?? "")

        startTransition(async () => {
          setError(null)

          const result = await signIn("credentials", {
            identifier,
            password,
            redirect: false,
            callbackUrl: "/app",
          })

          if (!result || result.error) {
            setError("Invalid email, username, or password.")
            return
          }

          router.push(result.url ?? "/app")
          router.refresh()
        })
      }}
    >
      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="identifier">
          Email or Username
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
          placeholder="student@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-foreground" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary"
          placeholder="Enter your password"
          required
        />
      </div>

      {registered ? (
        <p className="rounded-xl border border-emerald-300/70 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Your account is ready. Sign in to continue.
        </p>
      ) : null}

      {error ? (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button className="h-11 w-full rounded-xl text-sm" type="submit" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New here?{" "}
        <Link className="font-medium text-foreground underline underline-offset-4" href="/register">
          Create a student account
        </Link>
      </p>
    </form>
  )
}
