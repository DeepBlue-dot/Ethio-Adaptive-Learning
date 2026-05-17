export default function HeroSection() {
  return (
    <header id="home" className="pt-32 pb-20 px-6 md:px-12 max-w-[1200px] mx-auto overflow-hidden relative">
      {/* Decorative Background Elements */}
      <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-success-emerald/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute top-40 left-10 text-outline-variant/30 font-display-lg text-4xl -rotate-12 -z-10">∫x²dx</div>
      <div className="absolute bottom-40 right-20 text-outline-variant/30 font-display-lg text-4xl rotate-12 -z-10">E=mc²</div>
      <div className="absolute top-1/3 left-1/4 w-32 h-32 border-4 border-primary/5 rounded-full -z-10"></div>
      <div className="absolute top-2/3 right-1/4 w-24 h-24 border-4 border-warning-gold/10 rounded-full -z-10"></div>

      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div className="space-y-8 z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-surface-container-highest rounded-full text-primary font-label-md text-label-md shadow-sm border border-primary/10">
            <span className="material-symbols-outlined text-sm text-warning-gold">local_fire_department</span>
            <span className="font-bold text-on-surface">Join 50k+ students</span> on a streak
          </div>

          <h1 className="font-display-lg text-headline-lg-mobile md:text-display-lg text-on-surface leading-tight">
            Prepare Smarter for{' '}
            <span className="text-primary relative inline-block">
              Grade 12 National Exams
              <svg
                className="absolute -bottom-2 left-0 w-full h-3 text-warning-gold opacity-50"
                preserveAspectRatio="none"
                viewBox="0 0 100 10"
              >
                <path d="M0 5 Q 50 10 100 5" fill="transparent" stroke="currentColor" strokeWidth="2" />
              </svg>
            </span>
          </h1>

          <p className="font-body-lg text-body-lg text-on-surface-variant max-w-lg">
            AI-powered adaptive learning, mock exams, spaced repetition, and personalized tutoring designed specifically for Ethiopian students.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 pt-4">
            <button className="bg-primary text-on-primary px-8 py-4 rounded-xl font-label-md text-label-md font-bold shadow-[0_4px_0_0_#0d2b80] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#0d2b80] transition-all text-center flex items-center justify-center gap-2 group">
              Start Learning{' '}
              <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                arrow_forward
              </span>
            </button>
            <button className="bg-surface-container-lowest text-on-surface border-2 border-outline-variant/30 px-8 py-4 rounded-xl font-label-md text-label-md font-semibold hover:bg-surface-variant hover:border-outline-variant transition-all text-center shadow-sm flex items-center justify-center gap-2">
              <span className="material-symbols-outlined text-sm text-primary">play_circle</span>
              Try Demo
            </button>
          </div>
        </div>

        <div className="relative z-10">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 to-transparent rounded-3xl -rotate-3 scale-105 -z-10 transition-transform duration-500 hover:rotate-0"></div>
          <img
            alt="Students studying with AI"
            className="w-full rounded-3xl shadow-2xl border border-surface-variant object-cover aspect-video bg-surface-container transition-transform duration-500 hover:scale-[1.02]"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAkEa-fxGrsC-YzDicz3OVlZqmnMx0E-UCodfbea-DMk-hZq7oFThQWZNBzMCFtmQuBjTL_GJpAqxZ785vtQ0-2MmF6YY-CWXd9L6SsIjuV5bxpThyG4uV0gzzR5ZcDF-E9Ti7NBjg9IhZIhEXHNomn2PV7XRLSpkT6984mdiDWr_Jt_LSXKrXToh3t020lBF8wx08FE2Gz2imBRoTIdQKFQUP66p3Y__yXdgjztUCyYwQeWTCdWB8_yCEtgIWPAJFg0b0AYDD15Bs"
          />

          {/* Floating Cards */}
          <div className="absolute -top-6 -left-8 glass-card rounded-xl p-3 flex items-center gap-3 floating-element z-20">
            <div className="w-10 h-10 rounded-full bg-warning-gold/20 flex items-center justify-center text-warning-gold">
              <span className="material-symbols-outlined">local_fire_department</span>
            </div>
            <div>
              <p className="font-label-md text-sm font-bold text-on-surface">12 Day Streak</p>
              <p className="font-caption text-xs text-on-surface-variant">Keep it up!</p>
            </div>
          </div>

          <div className="absolute -bottom-8 -right-6 glass-card rounded-xl p-3 flex items-center gap-3 floating-element-delayed z-20">
            <div className="w-10 h-10 rounded-full bg-success-emerald/20 flex items-center justify-center text-success-emerald">
              <span className="material-symbols-outlined">trending_up</span>
            </div>
            <div>
              <p className="font-label-md text-sm font-bold text-on-surface">Mastery +15%</p>
              <p className="font-caption text-xs text-on-surface-variant">Physics Unit 4</p>
            </div>
          </div>

          <div className="absolute top-1/2 -right-12 glass-card rounded-xl p-3 flex items-center gap-3 floating-element z-20 transform -translate-y-1/2">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined">smart_toy</span>
            </div>
            <div>
              <p className="font-label-md text-sm font-bold text-on-surface">AI Tutor Active</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
