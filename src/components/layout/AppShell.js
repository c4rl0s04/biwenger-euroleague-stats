'use client';

import TopHeader from './TopHeader';
import Sidebar from './Sidebar';
import MobileNavigation from './MobileNavigation';
import Link from 'next/link';
import { Github, Twitter, Instagram } from 'lucide-react';
import NewsTicker from '../ui/NewsTicker';

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">
        Saltar al contenido
      </a>
      {/* Top Header - always visible */}
      <TopHeader />

      <div className="flex flex-1">
        {/* Sidebar - hidden on mobile unless open */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
          <NewsTicker />
          <main id="main-content" tabIndex={-1} className="flex-grow w-full app-main-content">
            {children}
          </main>

          {/* Premium Footer */}
          <footer className="border-t border-white/5 mt-auto bg-card/20 backdrop-blur-md relative overflow-hidden">
            {/* Subtle accent glow */}
            <div className="absolute bottom-0 left-1/4 w-[500px] h-[200px] bg-primary/5 blur-[120px] rounded-full -z-10" />

            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-16">
              <div className="mb-8 grid grid-cols-1 gap-8 md:mb-12 md:grid-cols-4 md:gap-12">
                {/* Brand Section */}
                <div className="col-span-1 md:col-span-2 space-y-6">
                  <div className="flex items-center gap-2">
                    <h3 className="text-3xl font-display tracking-wide bg-gradient-to-br from-white via-white to-primary/80 bg-clip-text text-transparent">
                      Biwenger<span className="text-primary">Stats</span>
                    </h3>
                  </div>
                  <p className="text-sm text-slate-400 leading-relaxed max-w-sm font-sans">
                    El compañero analítico definitivo para mánagers de Biwenger Euroliga. Domina tu
                    liga con datos en tiempo real, métricas de rendimiento avanzadas y herramientas
                    visuales de élite.
                  </p>
                </div>

                {/* Navigation Columns */}
                <div className="hidden space-y-6 md:block">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 font-sans">
                    Project
                  </h4>
                  <ul className="space-y-3 text-sm font-medium text-slate-400">
                    <li>
                      <Link
                        href="/standings"
                        className="hover:text-primary transition-all flex items-center gap-2 group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-all" />
                        Clasificación
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/schedule"
                        className="hover:text-primary transition-all flex items-center gap-2 group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-all" />
                        Alineaciones
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="/market"
                        className="hover:text-primary transition-all flex items-center gap-2 group"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-all" />
                        Mercado
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Social & Version */}
                <div className="hidden space-y-6 md:block">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-slate-500 font-sans">
                    Comunidad
                  </h4>
                  <div className="flex gap-4">
                    <a
                      href="https://github.com/c4rl0s04/AdvancedEuroleagueBiwengerStats"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all hover:scale-110"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-sky-400 transition-all hover:scale-110"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-pink-500 transition-all hover:scale-110"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  </div>
                  <div className="pt-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-md">
                      v2.5.0 • Platinum Edition
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-6 text-center md:flex-row md:gap-6 md:pt-8 md:text-left">
                <p className="text-[11px] font-medium text-slate-500 font-sans tracking-wide">
                  © 2026 BiwengerStats. Built for the European Basketball Community.
                </p>
                <div className="flex gap-8 text-[11px] font-bold text-slate-500 uppercase tracking-widest font-sans">
                  <span className="cursor-pointer hover:text-white transition-colors">
                    Privacidad
                  </span>
                  <span className="cursor-pointer hover:text-white transition-colors">
                    Términos
                  </span>
                  <span className="cursor-pointer hover:text-white transition-colors">
                    Contacto
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
      <MobileNavigation />
    </div>
  );
}
