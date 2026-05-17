import { ForgotPasswordForm } from "@/components/shared/forgot-password-form"

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-12 overflow-hidden transition-colors duration-300 bg-gradient-to-br from-slate-50 to-white dark:from-[#0F1115] dark:to-[#0F1115]">
      {/* Light theme background (visible when not dark) */}
      <div className="absolute inset-0 -z-10 block dark:hidden opacity-60">
        <svg className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="forgot-light-g" cx="70%" cy="20%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f1f5f9" stopOpacity="1" />
            </radialGradient>
            <pattern id="forgot-light-dot" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#e6eef6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#forgot-light-g)" />
          <rect width="100%" height="100%" fill="url(#forgot-light-dot)" opacity="0.06" />
        </svg>
      </div>

      {/* Dark theme background (visible when dark) */}
      <div className="absolute inset-0 -z-10 hidden dark:block opacity-70">
        <svg className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="forgot-dark-g" cx="30%" cy="20%" r="60%">
              <stop offset="0%" stopColor="#0b1220" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0f1115" stopOpacity="1" />
            </radialGradient>
            <pattern id="forgot-dark-dot" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#0a0b0d" />
            </pattern>
            <filter id="forgot-softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="40" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#forgot-dark-g)" />
          <rect width="100%" height="100%" fill="url(#forgot-dark-dot)" opacity="0.03" />
          <ellipse cx="15%" cy="20%" rx="350" ry="220" fill="#0f1724" opacity="0.28" filter="url(#forgot-softGlow)" />
        </svg>
      </div>

      <div className="w-full max-w-5xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-white/60 backdrop-blur-sm shadow-2xl dark:bg-slate-900/70 dark:border-slate-800/60 lg:grid-cols-[0.95fr_1.05fr] grid w-full">
        <section className="bg-slate-950 px-8 py-10 text-white lg:px-10 lg:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-teal-300">
            Password recovery
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight dark:text-white">
            Forgot your password?
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300 dark:text-slate-300">
            Enter the email address for your account and we&apos;ll send you a secure link to reset your password.
          </p>
        </section>
        <section className="px-8 py-10 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-md">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-teal-700 dark:text-teal-300">
              Reset your access
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground dark:text-white">Request password reset</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground dark:text-slate-300">
              We&apos;ll only use your email address to verify your account and send reset instructions.
            </p>

            <div className="mt-8">
              <ForgotPasswordForm />
            </div>
          </div>
        </section>
        </div>
      </div>
    </main>
  )
}
