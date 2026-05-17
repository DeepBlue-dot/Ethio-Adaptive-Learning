import Link from "next/link"

export default function NotFoundPage() {
  return (
    <main className="relative min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-slate-900 dark:text-slate-100">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-16">
        <div className="w-full rounded-[2rem] border border-slate-200/80 bg-white/90 p-10 shadow-2xl shadow-slate-900/10 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-950/90 dark:shadow-black/20">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 text-4xl font-bold text-primary dark:bg-primary/20 dark:text-primary">
              404
            </div>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight">Page not found</h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                The page you are looking for does not exist or has been moved. Use the button below to return home and keep learning.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-700"
            >
              Return home
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
