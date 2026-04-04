import Link from "next/link"
import { ArrowRight, ShieldCheck, Sparkles, Trophy } from "lucide-react"

import { Button } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(19,78,74,0.18),_transparent_38%),linear-gradient(180deg,_#f7fbfa_0%,_#eef5f2_100%)]">
      <section className="mx-auto flex min-h-screen w-full max-w-6xl flex-col justify-between px-6 py-10 lg:px-10">
        <header className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-teal-700">
              Ethio Adaptive Learning
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              A mastery-based Grade 12 learning platform for the EHSLCE journey.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/login">Sign In</Link>
            </Button>
            <Button asChild className="rounded-full bg-teal-700 px-5 text-white hover:bg-teal-800">
              <Link href="/register">Get Started</Link>
            </Button>
          </div>
        </header>

        <div className="grid gap-10 py-16 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex rounded-full border border-teal-200 bg-white/80 px-4 py-2 text-sm text-teal-800 shadow-sm backdrop-blur">
              Phase 1 foundation is now focused on secure identity and role-aware access.
            </div>

            <div className="space-y-5">
              <h1 className="max-w-3xl text-5xl font-semibold tracking-tight text-slate-950 sm:text-6xl">
                Personalized exam preparation, grounded in structure before intelligence.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                Students get a clean learning workspace, while admins get a protected operational shell
                ready for curriculum authoring, adaptive assessment, and analytics in the next phases.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Button
                asChild
                className="h-12 rounded-full bg-slate-950 px-6 text-white hover:bg-slate-800"
              >
                <Link href="/register">
                  Create student account
                  <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full px-6">
                <Link href="/login">Sign in to your workspace</Link>
              </Button>
            </div>
          </div>

          <div className="grid gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-6 shadow-xl backdrop-blur">
            <div className="rounded-3xl bg-slate-950 p-6 text-white">
              <div className="mb-4 flex items-center gap-3">
                <ShieldCheck className="size-5 text-teal-300" />
                <p className="text-sm font-medium text-teal-100">Secure by default</p>
              </div>
              <p className="text-2xl font-semibold">Role-aware access for students and admins</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-5">
                <Sparkles className="size-5 text-teal-700" />
                <h2 className="mt-4 text-lg font-semibold">Ready for adaptive logic</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  The app shell is prepared for BKT, KST, retention, and AI tutoring without mixing them
                  into Phase 1.
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-5">
                <Trophy className="size-5 text-amber-600" />
                <h2 className="mt-4 text-lg font-semibold">Student-first momentum</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Registration, sign-in, protected dashboards, and seeded admin access are the first
                  concrete milestone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
