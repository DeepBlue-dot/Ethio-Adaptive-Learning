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
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="identifier">
          Email or Username
        </label>
        <input
          id="identifier"
          name="identifier"
          type="text"
          autoComplete="username"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
          placeholder="student@example.com"
          required
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200" htmlFor="password">
            Password
          </label>
          <Link href="/forgot-password" className="text-sm text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          className="w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm transition focus:outline-none focus:ring-2 focus:ring-blue-600 dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-100"
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

      <Button
        className="h-11 w-full rounded-xl text-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white shadow hover:shadow-lg transform transition-all hover:-translate-y-0.5"
        type="submit"
        disabled={isPending}
      >
        {isPending ? "Signing in..." : "Sign In"}
      </Button>

      <p className="text-center text-sm text-muted-foreground mt-4">
        New here?{' '}
        <Link className="font-medium text-blue-600 hover:underline" href="/register">
          Create a student account
        </Link>
      </p>
    </form>
  )
}
