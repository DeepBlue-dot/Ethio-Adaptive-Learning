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
    <main className="min-h-screen bg-background text-on-background font-body-md antialiased overflow-x-hidden">
      <style>{`
        .material-symbols-outlined {
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
          background: #f7f9fb;
          color: #191c1e;
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
