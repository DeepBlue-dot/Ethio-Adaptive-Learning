import { redirectIfAuthenticated } from "@/lib/auth"
import { RegisterForm } from "@/components/shared/register-form"

export default async function RegisterPage() {
  await redirectIfAuthenticated()

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,_#f7fbfa_0%,_#eef5f2_100%)] px-6 py-12">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        <section className="px-8 py-10 lg:px-10 lg:py-14">
          <div className="mx-auto max-w-md">
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-teal-700">
              Student Registration
            </p>
            <h1 className="mt-3 text-3xl font-semibold text-foreground">Create your account</h1>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              This first release is focused on secure identity, protected dashboards, and a clean
              foundation for later adaptive features.
            </p>

            <div className="mt-8">
              <RegisterForm />
            </div>
          </div>
        </section>

        <section className="bg-teal-900 px-8 py-10 text-white lg:px-10 lg:py-14">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-teal-200">
            Phase 1 Milestone
          </p>
          <h2 className="mt-6 text-4xl font-semibold leading-tight">
            Register once, then land inside the right learning workspace.
          </h2>
          <div className="mt-8 space-y-4 text-sm leading-7 text-teal-50/90">
            <p>Student signups create both the identity record and the linked learning profile.</p>
            <p>Admin accounts remain seed-only in this phase to keep platform control intentional.</p>
            <p>Role-based routing and protected layouts are in place before curriculum logic arrives.</p>
          </div>
        </section>
      </div>
    </main>
  )
}
