export default function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      icon: 'query_stats',
      title: 'Assess',
      description: 'Start with a diagnostic test that maps your strengths and reveals exactly where to focus.',
      accent: 'from-blue-500 to-blue-700',
    },
    {
      number: '2',
      icon: 'model_training',
      title: 'Learn',
      description: 'Engage with lessons that adapt to your pace and guide you through each concept in real time.',
      accent: 'from-cyan-500 to-emerald-500',
    },
    {
      number: '3',
      icon: 'memory',
      title: 'Retain',
      description: 'Review smarter with spaced repetition so you remember more and stress less before exam day.',
      accent: 'from-emerald-500 to-lime-500',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 md:py-28 bg-gradient-to-br from-slate-50 via-slate-100 to-white dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 relative overflow-hidden">
      <div className="absolute left-[-15%] top-20 w-72 h-72 rounded-full bg-blue-400/10 blur-3xl" />
      <div className="absolute right-[-15%] bottom-24 w-72 h-72 rounded-full bg-emerald-400/10 blur-3xl" />
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <p className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-primary/90 mb-4">
            <span className="material-symbols-outlined text-base">insights</span>
            Step-by-step exam mastery
          </p>
          <h2 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-slate-950 dark:text-white font-extrabold mb-4">
            How EthioPrep Helps You Learn Faster
          </h2>
          <p className="font-body-lg text-body-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            From assessment to mastery, our system keeps you on track with personalized practice, guided learning, and review that lasts.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {steps.map((step, idx) => (
            <div key={step.number} className="group relative rounded-[2rem] border border-slate-200/60 dark:border-slate-800/60 bg-white dark:bg-slate-900/95 shadow-lg hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 overflow-hidden">
              <div className="absolute inset-x-0 top-0 h-2 bg-gradient-to-r from-blue-500 to-emerald-500" style={{ backgroundImage: `linear-gradient(90deg, ${step.accent})` }} />
              <div className="relative p-8 md:p-10">
                <div className="flex items-center justify-between gap-4 mb-6">
                  <div className="flex items-center justify-center w-14 h-14 rounded-3xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm">
                    <span className="material-symbols-outlined text-2xl">{step.icon}</span>
                  </div>
                  <div className="rounded-full bg-slate-950/95 text-white px-4 py-2 text-sm font-semibold shadow-sm">
                    Step {step.number}
                  </div>
                </div>
                <h3 className="font-headline-md text-xl md:text-2xl font-bold text-slate-950 dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="font-body-md text-sm md:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
                  {step.description}
                </p>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
