import AIFeatureCard from './ai-feature-card';

export default function IntelligenceSection() {
  return (
    <section id="intelligence" className="py-24 bg-surface-container-lowest dark:bg-inverse-surface/80 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-30 dark:opacity-10 pointer-events-none"></div>
      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface dark:text-surface font-extrabold mb-4">
            The <span className="text-primary">Intelligence</span> Behind EthioPrep
          </h2>
          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-2xl mx-auto">
            A unified system designed to understand your unique learning profile and guide you to mastery.
          </p>
        </div>

        {/* Desktop View */}
        <div className="relative max-w-4xl mx-auto h-[600px] flex items-center justify-center mt-12 hidden md:flex">
          <div className="absolute w-[400px] h-[400px] border border-outline-variant/20 dark:border-outline/20 rounded-full animate-[spin_60s_linear_infinite] -z-10"></div>
          <div className="absolute w-[550px] h-[550px] border border-outline-variant/10 dark:border-outline/10 rounded-full animate-[spin_90s_linear_infinite_reverse] -z-10"></div>

          {/* Central Hub */}
          <div className="relative z-20 bg-surface-container-lowest dark:bg-surface-container shadow-2xl rounded-2xl p-6 border-2 border-primary w-64 text-center flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <span className="material-symbols-outlined text-primary text-4xl">psychology</span>
            </div>
            <h3 className="font-headline-md text-lg font-bold text-on-surface">Adaptive Intelligence Engine</h3>
            <p className="font-caption text-xs text-on-surface-variant">The core that connects all learning modalities</p>
          </div>

          {/* Connecting Lines */}
          <svg className="absolute inset-0 w-full h-full -z-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
            <line className="text-outline-variant/30 dark:text-outline/30" stroke="currentColor" strokeDasharray="5,5" strokeWidth="2" x1="50%" x2="50%" y1="50%" y2="15%" />
            <line className="text-outline-variant/30 dark:text-outline/30" stroke="currentColor" strokeDasharray="5,5" strokeWidth="2" x1="50%" x2="85%" y1="50%" y2="35%" />
            <line className="text-outline-variant/30 dark:text-outline/30" stroke="currentColor" strokeDasharray="5,5" strokeWidth="2" x1="50%" x2="80%" y1="50%" y2="75%" />
            <line className="text-outline-variant/30 dark:text-outline/30" stroke="currentColor" strokeDasharray="5,5" strokeWidth="2" x1="50%" x2="20%" y1="50%" y2="75%" />
            <line className="text-outline-variant/30 dark:text-outline/30" stroke="currentColor" strokeDasharray="5,5" strokeWidth="2" x1="50%" x2="15%" y1="50%" y2="35%" />
          </svg>

          {/* Nodes */}
          <div className="absolute top-[5%] left-1/2 -translate-x-1/2">
            <AIFeatureCard icon="analytics" title="Diagnostic Assessment" iconColor="secondary" />
          </div>
          <div className="absolute top-[25%] right-[5%]">
            <AIFeatureCard icon="route" title="Adaptive Learning Paths" iconColor="success-emerald" />
          </div>
          <div className="absolute bottom-[15%] right-[10%]">
            <AIFeatureCard icon="update" title="Spaced Repetition" iconColor="warning-gold" />
          </div>
          <div className="absolute bottom-[15%] left-[10%]">
            <AIFeatureCard icon="assignment_turned_in" title="Exam Mastery" iconColor="error" />
          </div>
          <div className="absolute top-[25%] left-[5%]">
            <AIFeatureCard icon="forum" title="AI Socratic Tutor" iconColor="primary" />
          </div>
        </div>

        {/* Mobile Fallback */}
        <div className="md:hidden grid grid-cols-1 gap-4 mt-8">
          <div className="bg-surface-container-lowest border-2 border-primary rounded-xl p-6 text-center shadow-md">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="material-symbols-outlined text-primary text-2xl">psychology</span>
            </div>
            <h3 className="font-headline-md text-lg font-bold text-on-surface">Adaptive Intelligence Engine</h3>
            <p className="font-caption text-xs text-on-surface-variant mt-1">The core connecting all learning modalities.</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <AIFeatureCard icon="analytics" title="Diagnostic Assessment" iconColor="secondary" />
            <AIFeatureCard icon="route" title="Adaptive Paths" iconColor="success-emerald" />
            <AIFeatureCard icon="update" title="Spaced Repetition" iconColor="warning-gold" />
            <AIFeatureCard icon="assignment_turned_in" title="Exam Mastery" iconColor="error" />
          </div>
        </div>
      </div>
    </section>
  );
}
