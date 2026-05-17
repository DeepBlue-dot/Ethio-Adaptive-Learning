'use client';

import { useEffect, useRef, useState } from 'react';
import CarouselCard from './carousel-card';

export default function FeaturesCarousel() {
  const trackRef = useRef<HTMLDivElement>(null);
  const prevBtnRef = useRef<HTMLButtonElement>(null);
  const nextBtnRef = useRef<HTMLButtonElement>(null);
  const [activeDot, setActiveDot] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    const prevBtn = prevBtnRef.current;
    const nextBtn = nextBtnRef.current;

    if (!track || !prevBtn || !nextBtn) return;
    track.scrollTo({ left: 0 });

    const updateButtonsAndDots = () => {
      const scrollLeft = track.scrollLeft;
      const maxScrollLeft = track.scrollWidth - track.clientWidth;

      prevBtn.disabled = scrollLeft <= 0;
      nextBtn.disabled = scrollLeft >= maxScrollLeft - 10;

      prevBtn.style.opacity = prevBtn.disabled ? '0.3' : '';
      nextBtn.style.opacity = nextBtn.disabled ? '0.3' : '';

      const cardWidth = (track.firstElementChild as HTMLElement)?.offsetWidth || 0;
      const gap = 24;
      const scrollIndex = Math.round(scrollLeft / (cardWidth + gap));
      setActiveDot(scrollIndex);
    };

    const handlePrev = () => scrollByCard(-1);
    const handleNext = () => scrollByCard(1);

    track.addEventListener('scroll', updateButtonsAndDots, { passive: true });
    updateButtonsAndDots();

    const scrollByCard = (direction: number) => {
      const cardWidth = (track.firstElementChild as HTMLElement)?.offsetWidth || 0;
      const gap = 24;
      const scrollAmount = (cardWidth + gap) * direction;
      track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    };

    prevBtn.addEventListener('click', handlePrev);
    nextBtn.addEventListener('click', handleNext);

    const handleResize = () => updateButtonsAndDots();
    window.addEventListener('resize', handleResize);

    return () => {
      track.removeEventListener('scroll', updateButtonsAndDots);
      prevBtn.removeEventListener('click', handlePrev);
      nextBtn.removeEventListener('click', handleNext);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <section id="features" className="py-24 bg-surface dark:bg-inverse-surface transition-colors duration-300 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[120px] -z-10 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-success-emerald/5 rounded-full blur-[100px] -z-10 pointer-events-none"></div>

      <div className="max-w-[1200px] mx-auto px-6 relative z-10">
        <div className="text-center mb-16">
          <h2 className="font-display-lg text-4xl md:text-5xl text-on-surface dark:text-surface font-extrabold tracking-tight mb-4">
            An Intelligent Learning System Built for
            <br />
            <span className="relative inline-block mt-1">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-indigo-500 to-success-emerald">
                Mastery
              </span>
              <svg
                className="absolute -bottom-2 left-0 w-full h-2 text-success-emerald/70"
                preserveAspectRatio="none"
                viewBox="0 0 100 20"
              >
                <path
                  d="M0 10 Q 25 20 50 10 T 100 10"
                  fill="transparent"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="3"
                />
              </svg>
            </span>
          </h2>
          <p className="font-body-lg text-lg text-on-surface-variant dark:text-outline-variant max-w-2xl mx-auto">
            Adaptive AI, spaced repetition, and exam simulation working together to help you ace the EHSLCE.
          </p>
        </div>

        <div className="relative group">
          <button
            ref={prevBtnRef}
            className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 dark:bg-inverse-surface/90 backdrop-blur-md rounded-full border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all hover:scale-110 disabled:opacity-0 hidden md:flex"
          >
            <span className="material-symbols-outlined text-2xl">chevron_left</span>
          </button>

          <button
            ref={nextBtnRef}
            className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/90 dark:bg-inverse-surface/90 backdrop-blur-md rounded-full border border-outline-variant/30 shadow-[0_4px_20px_rgba(0,0,0,0.1)] flex items-center justify-center text-primary opacity-0 group-hover:opacity-100 transition-all hover:scale-110 disabled:opacity-0 hidden md:flex"
          >
            <span className="material-symbols-outlined text-2xl">chevron_right</span>
          </button>

          <div
            ref={trackRef}
            className="flex gap-6 overflow-x-auto snap-x snap-mandatory hide-scrollbar pb-10 pt-4 px-2 -mx-2"
          >
            <CarouselCard
              icon="smart_toy"
              title="AI Tutor Experience"
              description="Step-by-step guidance through complex math and physics problems. Never get stuck again."
              accentColor="primary"
              content={
                <div className="flex items-start gap-2 mb-2">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shrink-0 mt-0.5">
                    <span className="material-symbols-outlined text-white text-[12px]">smart_toy</span>
                  </div>
                  <div className="bg-white/80 dark:bg-black/50 p-2 rounded-lg rounded-tl-none text-xs text-primary font-mono border border-primary/10 shadow-sm w-full text-center">
                    ∫ x² dx = (x³)/3 + C
                  </div>
                </div>
              }
            />

            <CarouselCard
              icon="route"
              title="Adaptive Learning"
              description="A personalized path to mastery. The engine continuously adjusts difficulty based on performance."
              accentColor="success-emerald"
              content={
                <>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-semibold text-on-surface">Biology Mastery</span>
                    <span className="text-xs font-bold text-success-emerald">85%</span>
                  </div>
                  <div className="h-2 w-full bg-surface-variant rounded-full overflow-hidden">
                    <div className="h-full bg-success-emerald w-[85%] rounded-full relative overflow-hidden">
                      <div className="absolute inset-0 bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:1rem_1rem] animate-[progress-bar-stripes_1s_linear_infinite]"></div>
                    </div>
                  </div>
                </>
              }
            />

            <CarouselCard
              icon="timer"
              title="Exam Simulator"
              description="Practice under pressure with timed mock exams that mirror the EHSLCE format."
              accentColor="error"
              content={
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
                    <span className="text-xs font-semibold text-on-surface">Physics - Unit 4</span>
                  </div>
                  <div className="bg-error/10 px-2 py-1 rounded text-xs font-mono font-bold text-error border border-error/20">
                    45:21
                  </div>
                </div>
              }
            />

            <CarouselCard
              icon="monitoring"
              title="Deep Analytics"
              description="Visualize your progress with comprehensive charts. Identify weak spots before exam day."
              accentColor="primary-container"
              content={
                <div className="h-[68px] flex items-end justify-between gap-1">
                  <div className="w-full bg-indigo-500/30 rounded-t h-[40%]"></div>
                  <div className="w-full bg-indigo-500/50 rounded-t h-[60%]"></div>
                  <div className="w-full bg-indigo-500/40 rounded-t h-[50%]"></div>
                  <div className="w-full bg-indigo-500/70 rounded-t h-[80%]"></div>
                  <div className="w-full bg-indigo-500 rounded-t h-[100%] relative shadow-[0_0_10px_rgba(99,102,241,0.5)]"></div>
                </div>
              }
            />

            <CarouselCard
              icon="view_carousel"
              title="Spaced Repetition"
              description="Smart scheduling ensures you never forget. Review concepts exactly when your brain needs them."
              accentColor="secondary"
              content={
                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center bg-white/60 dark:bg-black/40 p-2 rounded border border-outline-variant/10">
                    <span className="text-xs font-medium text-on-surface truncate">Photosynthesis</span>
                    <span className="text-[10px] font-bold text-secondary bg-secondary/10 px-1.5 py-0.5 rounded">
                      In 4 days
                    </span>
                  </div>
                  <div className="flex justify-between items-center bg-white/40 dark:bg-black/20 p-2 rounded border border-outline-variant/10 opacity-70">
                    <span className="text-xs font-medium text-on-surface truncate">Newton&apos;s Laws</span>
                    <span className="text-[10px] font-bold text-on-surface-variant bg-surface-variant px-1.5 py-0.5 rounded">
                      In 12 days
                    </span>
                  </div>
                </div>
              }
            />

            <CarouselCard
              icon="military_tech"
              title="Gamification"
              description="Stay motivated with daily streaks, earn XP, and collect badges as you master new topics."
              accentColor="warning-gold"
              content={
                <div className="flex items-center justify-center gap-4">
                  <div className="flex items-center gap-2 bg-white/80 dark:bg-black/50 px-3 py-1.5 rounded-lg border border-warning-gold/20 shadow-sm">
                    <span className="material-symbols-outlined text-warning-gold text-lg">
                      local_fire_department
                    </span>
                    <span className="text-sm font-bold text-on-surface">14 Day Streak</span>
                  </div>
                </div>
              }
            />
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <button
              key={index}
              onClick={() => {
                if (trackRef.current && trackRef.current.firstElementChild) {
                  const cardWidth = (trackRef.current.firstElementChild as HTMLElement).offsetWidth;
                  const gap = 24;
                  const scrollAmount = (cardWidth + gap) * index;
                  trackRef.current.scrollTo({ left: scrollAmount, behavior: 'smooth' });
                }
              }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === activeDot ? 'bg-primary w-6' : 'bg-primary/30'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
