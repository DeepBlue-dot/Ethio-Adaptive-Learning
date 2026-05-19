import Link from "next/link"
import { CheckCircle2, XCircle } from "lucide-react"

import {
  invalidateEmailVerificationToken,
  markUserEmailVerified,
  verifyEmailVerificationToken,
} from "@/lib/users"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

type VerifyEmailPageProps = {
  searchParams: Promise<{ email?: string; token?: string }>
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const resolvedSearchParams = await searchParams
  const email = resolvedSearchParams?.email?.trim().toLowerCase() ?? ""
  const token = resolvedSearchParams?.token ?? ""

  let status: "success" | "error" = "error"
  let title = "Unable to verify your email"
  let message =
    "The verification link is invalid or expired. Please request a new verification email."
  let actionLabel = "Continue to login"
  let actionHref = "/login"
  let icon = <XCircle className="h-14 w-14 text-red-600" />

  if (!EMAIL_REGEX.test(email) || !token) {
    status = "error"
    title = "Missing or invalid verification data"
    message =
      "We could not verify your account because the link is missing required information. Please use the email link again or request a new verification email."
  } else {
    try {
      const isValid = await verifyEmailVerificationToken(email, token)

      if (!isValid) {
        status = "error"
        title = "Verification link expired or invalid"
        message =
          "This verification link is no longer valid. Sign in to your account and request a new verification email."
      } else {
        await markUserEmailVerified(email)
        await invalidateEmailVerificationToken(email, token)

        status = "success"
        title = "Email verified successfully"
        message =
          "Your email address is now verified. You can sign in and continue using EthioPrep."
        icon = <CheckCircle2 className="h-14 w-14 text-emerald-600" />
      }
    } catch (error) {
      status = "error"
      title = "Verification failed"
      message =
        error instanceof Error
          ? error.message
          : "An unexpected error occurred while verifying your email."
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-12 overflow-hidden transition-colors duration-300 bg-gradient-to-br from-gray-50 to-white dark:from-[#0F1115] dark:to-[#0F1115]">
      <div className="absolute inset-0 -z-10 block dark:hidden opacity-60">
        <svg className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="verify-light-g" cx="70%" cy="20%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="1" />
            </radialGradient>
            <pattern id="verify-light-dot" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#eef6ff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#verify-light-g)" />
          <rect width="100%" height="100%" fill="url(#verify-light-dot)" opacity="0.05" />
        </svg>
      </div>

      <div className="absolute inset-0 -z-10 hidden dark:block opacity-70">
        <svg className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="verify-dark-g" cx="30%" cy="20%" r="60%">
              <stop offset="0%" stopColor="#071025" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0f1115" stopOpacity="1" />
            </radialGradient>
            <pattern id="verify-dark-dot" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#06070a" />
            </pattern>
            <filter id="verify-softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="40" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#verify-dark-g)" />
          <rect width="100%" height="100%" fill="url(#verify-dark-dot)" opacity="0.03" />
          <ellipse cx="20%" cy="18%" rx="320" ry="200" fill="#071225" opacity="0.26" filter="url(#verify-softGlow)" />
        </svg>
      </div>

      <div className="w-full max-w-4xl">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/60 backdrop-blur-sm shadow-2xl dark:bg-slate-900/70 dark:border-slate-800/60">
          <div className="grid grid-cols-1 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="flex items-center justify-center bg-slate-900 text-white p-8 lg:p-12">
              <div className="max-w-sm">
                <p className="text-sm font-semibold uppercase tracking-widest text-sky-300">Email Verification</p>
                <h1 className="mt-4 text-3xl font-extrabold">Verify your email</h1>
                <p className="mt-4 text-sm text-slate-200">
                  We&apos;re checking your verification link and updating your account status.
                </p>
              </div>
            </section>

            <section className="flex items-center justify-center bg-white p-8 lg:p-12">
              <div className="w-full max-w-md text-center">
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-3xl bg-slate-100 text-slate-900 dark:bg-slate-800 dark:text-white">
                  {icon}
                </div>
                <h2 className="mt-8 text-3xl font-semibold text-slate-900 dark:text-white">{title}</h2>
                <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">{message}</p>

                <div className="mt-8 flex flex-col gap-3">
                  <Link
                    href={actionHref}
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    {actionLabel}
                  </Link>
                  {status === "error" ? (
                    <Link href="/login" className="text-sm text-slate-500 underline hover:text-slate-700 dark:text-slate-400">
                      Sign in to request a new verification email
                    </Link>
                  ) : null}
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
