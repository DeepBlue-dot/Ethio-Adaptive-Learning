'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';

export default function NavigationBar() {
  const [isOpen, setIsOpen] = useState(false);

  const navLinks = useMemo(
    () => [
      { label: 'Home', href: '#home' },
      { label: 'Features', href: '#features' },
      { label: 'Intelligence', href: '#intelligence' },
      { label: 'How it Works', href: '#how-it-works' },
      { label: 'Why EthioPrep', href: '#why' },
    ],
    []
  );

  const [activeSection, setActiveSection] = useState<string>('home');

  useEffect(() => {
    const ids = navLinks.map((l) => l.href.replace('#', ''));
    const sections = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (!sections.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
        });
      },
      { root: null, rootMargin: '0px', threshold: 0.5 }
    );

    sections.forEach((s) => observer.observe(s));
    return () => observer.disconnect();
  }, [navLinks]);

  function handleNavClick(e: React.MouseEvent, href: string) {
    e.preventDefault();
    const id = href.replace('#', '');
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      window.location.assign(href);
    }
    setIsOpen(false);
  }

  return (
    <>
      <style>{`
        .nav-underline {
          position: relative;
        }
        .nav-underline::after {
          content: '';
          position: absolute;
          bottom: -4px;
          left: 0;
          width: 0;
          height: 2px;
          background: linear-gradient(90deg, #3B82F6, #10B981);
          transition: width 0.3s ease;
        }
        .nav-underline:hover::after {
          width: 100%;
        }
      `}</style>

      <nav className="fixed top-0 w-full z-50 bg-white/90 dark:bg-slate-950/90 backdrop-blur-lg border-b border-slate-200/50 dark:border-slate-800/50 shadow-md">
        <div className="max-w-[1400px] mx-auto px-6 md:px-12 py-4">
          <div className="flex justify-between items-center">
            
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 group-hover:shadow-lg transition-shadow duration-300">
                <Image
                  src="/screen.png"
                  alt="EthioPrep Logo"
                  width={40}
                  height={40}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="font-bold text-lg text-slate-900 dark:text-white">EthioPrep</span>
                <span className="text-xs text-slate-600 dark:text-slate-400 block">Learning</span>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex gap-8 items-center">
              {navLinks.map((link) => {
                const isActive = activeSection === link.href.replace('#', '');
                return (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={(e) => handleNavClick(e, link.href)}
                    className={`nav-underline text-sm font-medium transition-colors duration-300 ${
                      isActive
                        ? 'text-blue-600 dark:text-blue-400'
                        : 'text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400'
                    }`}
                  >
                    {link.label}
                  </a>
                );
              })}
            </div>

            {/* Auth Buttons */}
            <div className="hidden lg:flex items-center gap-3">
              <Link
                href="/login"
                className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-sm font-medium shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                Register
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="lg:hidden p-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <span className="material-symbols-outlined text-2xl">
                {isOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>

          {/* Mobile Menu */}
          {isOpen && (
            <div className="lg:hidden mt-4 pt-4 border-t border-slate-200/50 dark:border-slate-800/50 space-y-2">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={(e) => handleNavClick(e, link.href)}
                  className={`block px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === link.href.replace('#', '')
                      ? 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {link.label}
                </a>
              ))}
              <div className="flex gap-2 pt-2 mt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                <Link
                  href="/login"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-center"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-emerald-500 text-white text-sm font-medium text-center"
                >
                  Register
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>
    </>
  );
}
