import { redirectIfAuthenticated } from "@/lib/auth"
import { RegisterForm } from "@/components/shared/register-form"

export default async function RegisterPage() {
  await redirectIfAuthenticated()

  return (
    <main className="relative flex min-h-screen items-center justify-center px-6 py-12 overflow-hidden transition-colors duration-300 bg-gradient-to-br from-slate-50 to-white dark:from-[#0F1115] dark:to-[#0F1115]">
      {/* Light theme background (visible when not dark) */}
      <div className="absolute inset-0 -z-10 block dark:hidden opacity-60">
        <svg className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="light-g" cx="70%" cy="20%" r="60%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#f1f5f9" stopOpacity="1" />
            </radialGradient>
            <pattern id="light-dot" x="0" y="0" width="18" height="18" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#e6eef6" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#light-g)" />
          <rect width="100%" height="100%" fill="url(#light-dot)" opacity="0.06" />
        </svg>
      </div>

      {/* Dark theme background (visible when dark) */}
      <div className="absolute inset-0 -z-10 hidden dark:block opacity-70">
        <svg className="w-full h-full" preserveAspectRatio="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="dark-g" cx="30%" cy="20%" r="60%">
              <stop offset="0%" stopColor="#0b1220" stopOpacity="0.75" />
              <stop offset="100%" stopColor="#0f1115" stopOpacity="1" />
            </radialGradient>
            <pattern id="dark-dot" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="#0a0b0d" />
            </pattern>
            <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="40" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="100%" height="100%" fill="url(#dark-g)" />
          <rect width="100%" height="100%" fill="url(#dark-dot)" opacity="0.03" />
          <ellipse cx="15%" cy="20%" rx="350" ry="220" fill="#0f1724" opacity="0.28" filter="url(#softGlow)" />
          <ellipse cx="85%" cy="80%" rx="420" ry="260" fill="#06202a" opacity="0.18" filter="url(#softGlow)" />
        </svg>
      </div>

      <div className="w-full max-w-6xl">
        <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/60 backdrop-blur-sm shadow-2xl dark:bg-slate-900/70 dark:border-slate-800/60">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            {/* Left - Form */}
            <section className="px-8 py-10 lg:px-12 lg:py-14">
              <div className="mx-auto max-w-md">
                <p className="text-xs font-medium uppercase tracking-widest text-slate-600 dark:text-slate-300">
                  STUDENT REGISTRATION
                </p>
                <h1 className="mt-3 text-3xl font-semibold text-slate-900 dark:text-white">
                  Create your account
                </h1>
                <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                  Join EthioPrep and unlock an adaptive study path tailored to your strengths and
                  weaknesses.
                </p>

                <div className="mt-8">
                  <RegisterForm />
                </div>
              </div>
            </section>

            {/* Right - Value Proposition */}
            <section className="px-8 py-10 lg:px-12 lg:py-14 bg-gradient-to-br from-slate-900 to-emerald-900 text-white rounded-tr-[1.5rem] rounded-br-[1.5rem]">
              <div className="mx-auto max-w-md">
                <p className="text-sm font-semibold uppercase tracking-[0.35em] text-emerald-200">
                  Your learning companion
                </p>
                <h2 className="mt-6 text-3xl md:text-4xl font-extrabold leading-tight">
                  Your personalized path to mastery starts here.
                </h2>
                <p className="mt-6 max-w-lg text-base leading-7 text-emerald-100/90">
                  Join thousands of students using adaptive intelligence to clear exams, track
                  progress in real-time, and study smarter. Start with a diagnostic, follow a
                  tailored learning path, and build confidence for exam day.
                </p>

                <div className="mt-8">
                  <ul className="space-y-3 text-emerald-100">
                    <li className="flex items-start gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">✓</span>
                      <span>AI-driven study plans and progress tracking</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">✓</span>
                      <span>Practice and spaced review tailored to you</span>
                    </li>
                  </ul>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </main>
  )
}
