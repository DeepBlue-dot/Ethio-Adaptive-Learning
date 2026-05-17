export default function CtaFooter() {
  return (
    <>
      <section className="py-20 px-6 md:px-12 bg-primary text-on-primary text-center relative overflow-hidden bg-pattern-tibeb">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-primary/50"></div>
        <div className="max-w-3xl mx-auto relative z-10 space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-md rounded-full text-white font-label-md text-label-md mb-4 border border-white/20">
            <span className="material-symbols-outlined text-warning-gold">workspace_premium</span>
            Master Your Exams
          </div>
          <h2 className="font-display-lg text-headline-lg-mobile md:text-headline-lg font-bold">
            Start Your Journey Toward University Success
          </h2>
          <p className="font-body-lg text-body-lg opacity-90 max-w-xl mx-auto">
            Join thousands of Ethiopian students mastering the EHSLCE with EthioPrep AI. Earn streaks, track mastery, and get personalized AI tutoring.
          </p>
          <button className="bg-surface-container-lowest text-primary px-10 py-4 rounded-xl font-label-md text-label-md font-bold shadow-xl hover:scale-105 hover:shadow-2xl transition-all duration-300 flex items-center justify-center gap-2 mx-auto">
            Create Free Account
            <span className="material-symbols-outlined text-warning-gold">local_fire_department</span>
          </button>
        </div>
      </section>

      <footer className="bg-surface-container-lowest dark:bg-inverse-surface w-full block border-t-8 border-primary/10 dark:border-primary-fixed/5 before:content-[''] before:block before:h-1 before:bg-[repeating-linear-gradient(90deg,transparent,transparent_10px,#194bdf_10px,#194bdf_20px)]">
        <div className="max-w-[1200px] mx-auto px-6 py-12 md:px-12 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-primary flex items-center justify-center grayscale">
                <span className="text-white font-bold text-xs">E</span>
              </div>
              <span className="font-headline-md text-headline-md font-bold text-primary">EthioPrep AI</span>
            </div>
            <p className="font-caption text-caption text-on-surface-variant">
              Empowering academic excellence through innovation.
            </p>
          </div>

          <div className="col-span-1 md:col-span-2 grid grid-cols-2 gap-8">
            <div className="space-y-4">
              <h4 className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">
                Product
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors hover:underline decoration-primary/50 underline-offset-4 focus-within:ring-2 focus-within:ring-primary/20 rounded"
                  >
                    Features
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors hover:underline decoration-primary/50 underline-offset-4 focus-within:ring-2 focus-within:ring-primary/20 rounded"
                  >
                    Curriculum
                  </a>
                </li>
                <li></li>
              </ul>
            </div>

            <div className="space-y-4">
              <h4 className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">
                Company
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="#"
                    className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors hover:underline decoration-primary/50 underline-offset-4 focus-within:ring-2 focus-within:ring-primary/20 rounded"
                  >
                    About
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors hover:underline decoration-primary/50 underline-offset-4 focus-within:ring-2 focus-within:ring-primary/20 rounded"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="#"
                    className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors hover:underline decoration-primary/50 underline-offset-4 focus-within:ring-2 focus-within:ring-primary/20 rounded"
                  >
                    Contact
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-label-md text-label-md text-on-surface font-bold uppercase tracking-wider">
              Legal
            </h4>
            <ul className="space-y-2">
              <li>
                <a
                  href="#"
                  className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors hover:underline decoration-primary/50 underline-offset-4 focus-within:ring-2 focus-within:ring-primary/20 rounded"
                >
                  Privacy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors hover:underline decoration-primary/50 underline-offset-4 focus-within:ring-2 focus-within:ring-primary/20 rounded"
                >
                  Terms
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="font-body-md text-body-md text-on-surface-variant dark:text-outline-variant hover:text-primary dark:hover:text-primary-fixed-dim transition-colors hover:underline decoration-primary/50 underline-offset-4 focus-within:ring-2 focus-within:ring-primary/20 rounded"
                >
                  License
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-outline-variant/20 py-6 px-6 md:px-12 text-center">
          <p className="font-body-md text-xs text-on-surface-variant">© 2026 EthioPrep AI. All rights reserved. 🇪🇹</p>
        </div>
      </footer>
    </>
  );
}
