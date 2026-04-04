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
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#f8fbfa_0%,_#edf5f1_100%)] px-6 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl lg:grid-cols-[0.95fr_1.05fr]">
        <section className="bg-slate-950 px-8 py-10 text-white lg:px-10 lg:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-teal-300">
            Welcome Back
          </p>
          <h1 className="mt-6 text-4xl font-semibold leading-tight">
            Continue your learning journey with the right workspace.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-slate-300">
            Students land in their personal dashboard. Admins enter the platform control surface. The
            adaptive engines come next, but the foundation is already secure and role-aware.
          </p>
        </section>

        <section className="px-8 py-10 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-md">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-teal-700">
              Sign In
            </p>
            <h2 className="mt-3 text-3xl font-semibold text-foreground">Access your account</h2>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              Use your email or username and password to continue.
            </p>

            <div className="mt-8">
              <LoginForm registered={params.registered === "1"} />
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
