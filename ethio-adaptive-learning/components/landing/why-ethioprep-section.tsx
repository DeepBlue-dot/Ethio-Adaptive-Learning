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
    <section id="why" className="py-24 bg-surface-container-lowest relative">
      <div className="max-w-[1000px] mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display-lg text-headline-lg-mobile md:text-headline-lg text-on-surface font-extrabold mb-4">
            Why EthioPrep?
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant">
            See how we compare to traditional study methods.
          </p>
        </div>

        <div className="overflow-x-auto rounded-xl border border-outline-variant/30 shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-surface-container-low text-on-surface">
                <th className="py-4 px-6 font-label-md font-bold text-sm uppercase tracking-wider w-1/3 border-b border-outline-variant/20">
                  Traditional Methods
                </th>
                <th className="py-4 px-6 font-label-md font-bold text-sm uppercase tracking-wider w-2/3 border-b border-outline-variant/20 bg-primary/5 text-primary">
                  EthioPrep
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant/20">
              {comparisons.map((comp, idx) => (
                <tr key={idx} className="hover:bg-surface-container-lowest transition-colors">
                  <td className="py-5 px-6 font-body-md text-on-surface-variant">{comp.traditional}</td>
                  <td className="py-5 px-6 font-body-md text-on-surface bg-primary/5 flex items-start gap-3">
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
