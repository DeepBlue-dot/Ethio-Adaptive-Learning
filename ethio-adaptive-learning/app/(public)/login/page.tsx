import { redirectIfAuthenticated } from "@/lib/auth"
import { LoginForm } from "@/components/shared/login-form"

type LoginPageProps = {
  searchParams: Promise<{
    registered?: string
  }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  await redirectIfAuthenticated()

  const params = await searchParams

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-12 overflow-hidden transition-colors duration-300 bg-gradient-to-br from-gray-50 to-white dark:from-[#0F1115] dark:to-[#0F1115]">
      {/* Light theme background (visible when not dark) */}
      <div className="absolute inset-0 -z-10 block dark:hidden opacity-60">
        <svg className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="login-light-g" cx="70%" cy="20%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f8fafc" stopOpacity="1" />
            </radialGradient>
            <pattern id="login-light-dot" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#eef6ff" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-light-g)" />
          <rect width="100%" height="100%" fill="url(#login-light-dot)" opacity="0.05" />
        </svg>
      </div>

      {/* Dark theme background (visible when dark) */}
      <div className="absolute inset-0 -z-10 hidden dark:block opacity-70">
        <svg className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="login-dark-g" cx="30%" cy="20%" r="60%">
              <stop offset="0%" stopColor="#071025" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0f1115" stopOpacity="1" />
            </radialGradient>
            <pattern id="login-dark-dot" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#06070a" />
            </pattern>
            <filter id="login-softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="40" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-dark-g)" />
          <rect width="100%" height="100%" fill="url(#login-dark-dot)" opacity="0.03" />
          <ellipse cx="20%" cy="18%" rx="320" ry="200" fill="#071225" opacity="0.26" filter="url(#login-softGlow)" />
        </svg>
      </div>

      <div className="w-full max-w-4xl">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/60 backdrop-blur-sm shadow-2xl dark:bg-slate-900/70 dark:border-slate-800/60">
          <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Left - Welcome Banner */}
          <section className="flex items-center justify-center bg-slate-900 text-white p-8 lg:p-12">
            <div className="max-w-sm">
              <p className="text-sm font-semibold uppercase tracking-widest text-sky-300">Welcome Back</p>
              <h1 className="mt-4 text-3xl font-extrabold">Welcome Back.</h1>
              <p className="mt-4 text-sm text-slate-200">
                Pick up right where you left off and keep building your path to exam mastery.
              </p>
            </div>
          </section>

          {/* Right - Sign In Form */}
          <section className="flex items-center justify-center bg-white p-8 lg:p-12">
            <div className="w-full max-w-md">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-600">Sign In</p>
              <h2 className="mt-3 text-2xl font-semibold text-slate-900">Access your account</h2>
              <p className="mt-2 text-sm text-slate-500">Use your email or username and password to continue.</p>

              <div className="mt-6">
                <LoginForm registered={params.registered === "1"} />
              </div>
            </div>
          </section>
          </div>
        </div>
      </div>
    </main>
  )
}
