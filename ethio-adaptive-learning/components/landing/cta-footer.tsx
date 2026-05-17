import Image from 'next/image';
import Link from 'next/link';

export default function CtaFooter() {
  return (
    <>
      {/* CTA Section */}
      <section className="py-16 md:py-24 px-6 md:px-12 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-blue-500 to-emerald-500"></div>
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/30 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
        </div>

        <div className="max-w-4xl mx-auto relative z-10">
          <div className="text-center space-y-6 md:space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-lg rounded-full text-white font-label-md text-label-md border border-white/30 hover:bg-white/30 transition-colors">
              <span className="material-symbols-outlined text-lg">verified</span>
              <span className="font-semibold">Ready to Excel?</span>
            </div>

            <div className="space-y-4">
              <h2 className="font-display-lg text-headline-lg-mobile md:text-display-lg font-black text-white leading-tight">
                Join 50,000+ Students <br className="hidden md:block" />
                <span className="text-emerald-200">Preparing for Success</span>
              </h2>
              <p className="font-body-lg text-body-lg text-white/90 max-w-2xl mx-auto">
                Start your journey to university today. Get AI-powered tutoring, track your progress, and master the EHSLCE with confidence.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/register"
                className="px-8 md:px-10 py-4 bg-white text-blue-600 rounded-xl font-label-md text-label-md font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center justify-center gap-2 group"
              >
                <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">
                  flash_on
                </span>
                Get Started Free
              </Link>
              <Link
                href="/login"
                className="px-8 md:px-10 py-4 bg-white/20 text-white rounded-xl font-label-md text-label-md font-bold border-2 border-white/40 hover:bg-white/30 transition-all duration-300 flex items-center justify-center gap-2 backdrop-blur-sm group"
              >
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">
                  play_circle
                </span>
                Try Demo
              </Link>
            </div>

            {/* Trust Badges */}
            <div className="pt-6 md:pt-8 flex flex-wrap justify-center gap-4 text-white/80 text-sm">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">shield_verified</span>
                <span>Secure & Private</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">speed</span>
                <span>Fast Learning</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-base">star</span>
                <span>Expert Content</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-950 dark:bg-black text-white w-full">
        {/* Top Section */}
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-16 md:py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 group-hover:shadow-lg transition-shadow duration-300">
                <Image
                  src="/screen.png"
                  alt="EthioPrep Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="font-black text-xl bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">EthioPrep</span>
              </div>
              <p className="text-sm text-gray-400 leading-relaxed">
                Empowering Ethiopian students with AI-powered adaptive learning to master national exams.
              </p>
              <div className="flex gap-3 pt-2">
                <a href="#" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-blue-500 transition-colors flex items-center justify-center text-xs">
                  <span className="material-symbols-outlined text-sm">facebook</span>
                </a>
                <a href="#" className="w-8 h-8 rounded-lg bg-white/10 hover:bg-blue-500 transition-colors flex items-center justify-center text-xs">
                  <span className="material-symbols-outlined text-sm">share</span>
                </a>
              </div>
            </div>

            {/* Product */}
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm uppercase tracking-widest">Product</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="#features" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center gap-2 group">
                    <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    Features
                  </a>
                </li>
                <li>
                  <a href="#intelligence" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center gap-2 group">
                    <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    AI Engine
                  </a>
                </li>
                <li>
                  <a href="#how-it-works" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center gap-2 group">
                    <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            {/* Company */}
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm uppercase tracking-widest">Company</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center gap-2 group">
                    <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    About Us
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center gap-2 group">
                    <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center gap-2 group">
                    <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    Contact
                  </a>
                </li>
              </ul>
            </div>

            {/* Legal */}
            <div className="space-y-4">
              <h4 className="font-bold text-white text-sm uppercase tracking-widest">Legal</h4>
              <ul className="space-y-2.5">
                <li>
                  <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center gap-2 group">
                    <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center gap-2 group">
                    <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a href="#" className="text-gray-400 hover:text-emerald-400 transition-colors text-sm font-medium flex items-center gap-2 group">
                    <span className="material-symbols-outlined text-base opacity-0 group-hover:opacity-100 transition-opacity">arrow_forward</span>
                    License
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-8"></div>

          {/* Bottom Section */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-gray-400">
            <p>© 2026 EthioPrep. All rights reserved. 🇪🇹</p>
            <div className="flex items-center gap-4">
              <span className="text-xs">Made with</span>
              <span className="material-symbols-outlined text-red-500 text-lg">favorite</span>
              <span className="text-xs">in Ethiopia</span>
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
