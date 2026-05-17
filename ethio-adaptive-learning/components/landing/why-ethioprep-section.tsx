export default function WhyEthioPrepSection() {
  const comparisons = [
    {
      traditional: 'Static Content',
      feature: 'Adaptive Learning',
      description: "No more 'one-size-fits-all' learning. Content adapts to your skill level.",
    },
    {
      traditional: 'Outdated Materials',
      feature: 'Accurate & Current',
      description: 'Verified, current curriculum content aligned with the latest standards.',
    },
    {
      traditional: 'Passive Reading',
      feature: 'Interactive Engagement',
      description: 'Instant Socratic feedback vs. just reading PDFs. Learn by doing.',
    },
    {
      traditional: 'Online-Only',
      feature: 'Smart-Offline',
      description: 'Intelligent features that work even with limited connectivity.',
    },
  ];

  return (
    <section id="why" className="py-16 md:py-24 bg-gradient-to-b from-slate-50 to-white dark:from-slate-900 dark:to-slate-950 relative">
      <div className="max-w-[1200px] mx-auto px-6 md:px-12 relative z-10">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-display-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-extrabold mb-4">
            Why EthioPrep?
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            See how we compare to traditional study methods.
          </p>
        </div>

        {/* Mobile: Card Layout */}
        <div className="md:hidden space-y-3">
          {comparisons.map((comp, idx) => (
            <div key={idx} className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-outline-variant/20 shadow-sm">
              <div className="mb-3">
                <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider mb-1">Traditional</p>
                <p className="font-semibold text-on-surface">{comp.traditional}</p>
              </div>
              <div className="bg-primary/5 dark:bg-primary/10 rounded-lg p-3 border-l-4 border-primary">
                <div className="flex items-start gap-2">
                  <span className="material-symbols-outlined text-success-emerald text-xl shrink-0">check_circle</span>
                  <div className="flex-1">
                    <p className="font-semibold text-on-surface text-sm mb-1">{comp.feature}</p>
                    <p className="text-xs text-on-surface-variant">{comp.description}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop: Table Layout */}
        <div className="hidden md:block overflow-x-auto rounded-xl border border-outline-variant/30 shadow-sm bg-white dark:bg-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low dark:bg-slate-700 text-on-surface">
                <th className="py-4 px-6 font-label-md font-bold text-sm uppercase tracking-wider w-1/3 border-b border-outline-variant/20">
                  Traditional Methods
                </th>
                <th className="py-4 px-6 font-label-md font-bold text-sm uppercase tracking-wider w-2/3 border-b border-outline-variant/20 bg-primary/5 dark:bg-primary/10 text-primary">
                  EthioPrep
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {comparisons.map((comp, idx) => (
                <tr key={idx} className="hover:bg-surface-container-lowest dark:hover:bg-slate-700/50 transition-colors">
                  <td className="py-5 px-6 font-body-md text-on-surface-variant">{comp.traditional}</td>
                  <td className="py-5 px-6 font-body-md text-on-surface bg-primary/5 dark:bg-primary/10 flex items-start gap-3">
                    <span className="material-symbols-outlined text-success-emerald shrink-0 mt-0.5">
                      check_circle
                    </span>
                    <div>
                      <strong className="block mb-1">{comp.feature}</strong>
                      <span className="text-sm text-on-surface-variant">{comp.description}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
