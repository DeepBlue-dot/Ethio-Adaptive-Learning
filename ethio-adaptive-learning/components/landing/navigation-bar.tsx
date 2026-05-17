'use client';

import { useState } from 'react';

export default function NavigationBar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = [
    { label: 'Features', href: '#' },
    { label: 'How it Works', href: '#' },
    { label: 'Pricing', href: '#' },
  ];

  return (
    <nav className="bg-surface-glass dark:bg-inverse-surface/80 backdrop-blur-xl fixed top-0 w-full z-50 border-b border-outline-variant/20 dark:border-outline/30 shadow-sm dark:shadow-none transition-all duration-300 hover:bg-white/90">
      <div className="flex justify-between items-center max-w-[1200px] mx-auto px-6 py-4 md:px-12">
        <div className="flex items-center gap-3 group cursor-pointer">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-indigo-600 flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm">E</span>
          </div>
          <span className="font-headline-md text-headline-md font-extrabold text-primary tracking-tight">
            EthioPrep AI
          </span>
        </div>

        <div className="hidden md:flex gap-8 items-center">
          <a
            href={navLinks[0].href}
            className="text-primary font-bold border-b-2 border-primary pb-1 font-label-md text-label-md hover:bg-primary/5 rounded-lg transition-all duration-200 px-2 flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-sm">auto_awesome</span>
            Features
          </a>
          {navLinks.slice(1).map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md hover:bg-primary/5 rounded-lg transition-all duration-200 px-2 py-1"
            >
              {link.label}
            </a>
          ))}
        </div>

        <button className="bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md text-label-md font-semibold shadow-[0_4px_0_0_#0d2b80] hover:translate-y-[2px] hover:shadow-[0_2px_0_0_#0d2b80] transition-all active:scale-95 transform duration-100 hidden md:flex items-center gap-2 group">
          Get Started
          <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
            arrow_forward
          </span>
        </button>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-on-surface"
          aria-label="Toggle menu"
        >
          <span className="material-symbols-outlined text-3xl">{isOpen ? 'close' : 'menu'}</span>
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t border-outline-variant/20 bg-surface-glass/95 backdrop-blur-xl">
          <div className="px-6 py-4 space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className="block text-on-surface-variant hover:text-primary transition-colors font-label-md text-label-md py-2"
              >
                {link.label}
              </a>
            ))}
            <button className="w-full bg-primary text-on-primary px-6 py-2 rounded-lg font-label-md text-label-md font-semibold shadow-[0_4px_0_0_#0d2b80] transition-all flex items-center justify-center gap-2">
              Get Started
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
