export default function HowItWorksSection() {
  const steps = [
    {
      number: '1',
      icon: 'query_stats',
      title: 'Assess',
      description: 'Start with a diagnostic assessment to initialize your mastery profile. We identify your strong suits and areas that need focus.',
      bgColor: 'bg-secondary/10',
      textColor: 'text-secondary',
      rotation: '-rotate-6',
    },
    {
      number: '2',
      icon: 'model_training',
      title: 'Adaptive Learning',
      description: 'Engage with lessons that adjust difficulty based on your performance in real-time, guided by our AI Socratic Tutor.',
      bgColor: 'bg-primary/10',
      textColor: 'text-primary',
      rotation: 'rotate-3',
      marginTop: 'md:mt-8',
    },
    {
      number: '3',
      icon: 'memory',
      title: 'Retain',
      description: "Use automated spaced repetition reviews to ensure you never forget what you've learned before the big exam day.",
      bgColor: 'bg-success-emerald/10',
      textColor: 'text-success-emerald',
      rotation: '-rotate-3',
      marginTop: 'md:mt-16',
    },
  ];

  return (
    <section id="how-it-works" className="py-24 bg-surface dark:bg-inverse-surface/90 relative">
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface font-extrabold mb-4">
            How It Works
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            A proven methodology to accelerate your learning and ensure retention.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`bg-surface-container-lowest rounded-2xl p-8 border border-outline-variant/20 shadow-md hover:shadow-lg transition-shadow relative ${
                step.marginTop || ''
              }`}
            >
              <div className="absolute -top-6 -left-6 text-9xl font-extrabold text-surface-container-highest/50 select-none pointer-events-none z-0">
                {step.number}
              </div>
              <div className="relative z-10">
                <div className={`w-16 h-16 rounded-2xl ${step.bgColor} flex items-center justify-center mb-6 ${step.textColor} transform ${step.rotation}`}>
                  <span className="material-symbols-outlined text-3xl">{step.icon}</span>
                </div>
                <h3 className="font-headline-md text-xl font-bold text-on-surface mb-3">{step.title}</h3>
                <p className="font-body-md text-on-surface-variant">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
