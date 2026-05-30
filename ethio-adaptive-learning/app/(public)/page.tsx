'use client';

import NavigationBar from '@/components/landing/navigation-bar';
import HeroSection from '@/components/landing/hero-section';
import FeaturesCarousel from '@/components/landing/features-carousel';
import IntelligenceSection from '@/components/landing/intelligence-section';
import HowItWorksSection from '@/components/landing/how-it-works-section';
import WhyEthioPrepSection from '@/components/landing/why-ethioprep-section';
import CtaFooter from '@/components/landing/cta-footer';

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-linear-to-br from-slate-50 via-blue-50/30 to-emerald-50/20 dark:from-slate-950 dark:via-slate-900/50 dark:to-slate-900/30 text-on-background font-body-md antialiased overflow-x-hidden relative">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 pointer-events-none -z-10">
        {/* Large animated gradient blobs */}
        <div className="absolute top-0 right-0 w-125 h-125 bg-linear-to-br from-blue-400/10 to-blue-600/5 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-100 h-100 bg-linear-to-tr from-emerald-400/10 to-emerald-600/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-75 h-75 bg-linear-to-r from-purple-400/5 to-pink-400/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
        
        {/* Floating dots grid */}
        <div className="absolute inset-0 opacity-30 dark:opacity-20">
          <div className="absolute top-20 left-10 w-2 h-2 bg-blue-500/20 rounded-full"></div>
          <div className="absolute top-40 right-20 w-2 h-2 bg-emerald-500/20 rounded-full"></div>
          <div className="absolute top-1/2 left-1/4 w-2 h-2 bg-blue-400/20 rounded-full"></div>
          <div className="absolute bottom-40 right-1/4 w-2 h-2 bg-emerald-400/20 rounded-full"></div>
          <div className="absolute bottom-20 left-1/3 w-2 h-2 bg-purple-400/20 rounded-full"></div>
        </div>

        {/* Subtle geometric lines */}
        <svg className="absolute inset-0 w-full h-full opacity-20 dark:opacity-10" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="80" height="80" patternUnits="userSpaceOnUse">
              <path d="M 80 0 L 0 0 0 80" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-300 dark:text-slate-700"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <style>{`
        .material-symbols-outlined {
          font-family: 'Material Symbols Outlined', sans-serif;
          font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .font-body-md {
          font-family: 'Hanken Grotesk', 'Segoe UI', sans-serif;
        }
        .bg-pattern-tibeb {
          background-image: repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(200,200,200,0.1) 10px, rgba(200,200,200,0.1) 20px);
        }
        .glass-card {
          background: rgba(255, 255, 255, 0.6);
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(255, 255, 255, 0.4);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
        }
        .dark .glass-card {
          background: rgba(45, 49, 51, 0.6);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.2);
        }
        .floating-element {
          animation: float 6s ease-in-out infinite;
        }
        .floating-element-delayed {
          animation: float 6s ease-in-out 3s infinite;
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
          100% { transform: translateY(0px); }
        }
        .bg-grid-pattern {
          background-image: linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px);
          background-size: 40px 40px;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .landing-surface {
          background: transparent;
          color: #191c1e;
          position: relative;
          z-index: 1;
        }
        html { scroll-behavior: smooth; }
      `}</style>

      <div className="landing-surface">
        <NavigationBar />
        <HeroSection />
        <FeaturesCarousel />
        <IntelligenceSection />
        <HowItWorksSection />
        <WhyEthioPrepSection />
        <CtaFooter />
      </div>
    </main>
  );
}
