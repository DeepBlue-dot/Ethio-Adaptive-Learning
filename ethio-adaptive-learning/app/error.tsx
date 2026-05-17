"use client"

import Link from "next/link"

type ErrorPageProps = {
  error: Error
  reset: () => void
}

export default function ErrorPage({ error, reset }: ErrorPageProps) {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-[2rem] border border-slate-200/80 bg-white/90 p-10 shadow-2xl shadow-slate-900/10 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 dark:shadow-black/20">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-rose-100 text-4xl font-bold text-rose-700 dark:bg-rose-900/20 dark:text-rose-200">
              !
            </div>
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-rose-600 dark:text-rose-300">Error</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight">Something went wrong</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                We encountered an unexpected error. Try again or return to the homepage to continue.
              </p>
            </div>
            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-700 dark:bg-slate-900">
              <p className="font-semibold text-sm text-slate-900 dark:text-slate-100">Error details</p>
              <p className="mt-2 break-words text-xs text-slate-600 dark:text-slate-400">{error?.message ?? "Unknown error"}</p>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700"
              >
                Try Again
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Go to homepage
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
