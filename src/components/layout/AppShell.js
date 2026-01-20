'use client';

import { useState } from 'react';
import TopHeader from './TopHeader';
import Sidebar from './Sidebar';
import Link from 'next/link';
import { Github, Twitter, Instagram } from 'lucide-react';
import NewsTicker from '../ui/NewsTicker';

export default function AppShell({ children }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Header - always visible */}
      <TopHeader onMobileMenuClick={() => setIsMobileMenuOpen(true)} />

      <div className="flex flex-1">
        {/* Sidebar - hidden on mobile unless open */}
        <Sidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
          <NewsTicker />
          <main className="flex-grow w-full">{children}</main>
          <footer className="border-t border-border mt-auto bg-card/30 backdrop-blur-sm">
            <div className="max-w-7xl mx-auto px-6 py-12">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                {/* Brand */}
                <div className="col-span-1 md:col-span-2 space-y-4">
                  <h3 className="text-lg font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                    BiwengerStats
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
                    Plataforma analítica avanzada para dominar tu liga fantasy de Euroliga. Datos en
                    tiempo real, estadísticas profundas y herramientas de predicción.
                  </p>
                </div>

                {/* Quick Links */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Explorar</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>
                      <Link href="/standings" className="hover:text-indigo-400 transition-colors">
                        Clasificación
                      </Link>
                    </li>
                    <li>
                      <Link href="/schedule" className="hover:text-indigo-400 transition-colors">
                        Alineaciones
                      </Link>
                    </li>
                    <li>
                      <Link href="/market" className="hover:text-indigo-400 transition-colors">
                        Mercado
                      </Link>
                    </li>
                  </ul>
                </div>

                {/* Socials */}
                <div className="space-y-4">
                  <h4 className="text-sm font-semibold text-foreground">Comunidad</h4>
                  <div className="flex gap-4">
                    <a
                      href="https://github.com/c4rl0s04/AdvancedEuroleagueBiwengerStats"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white hover:text-white/80 transition-colors"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                    <a
                      href="https://twitter.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-400 hover:text-sky-300 transition-colors"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                    <a
                      href="https://instagram.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-500 hover:text-pink-400 transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                  </div>
                  <p className="text-xs text-muted-foreground pt-2">v2.0.0 • 2026 Edition</p>
                </div>
              </div>

              <div className="border-t border-border/50 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p className="text-xs text-muted-foreground">
                  © 2026 BiwengerStats. Todos los derechos reservados.
                </p>
                <div className="flex gap-6 text-xs text-muted-foreground">
                  <span className="cursor-default hover:text-foreground transition-colors">
                    Privacidad
                  </span>
                  <span className="cursor-default hover:text-foreground transition-colors">
                    Términos
                  </span>
                  <span className="cursor-default hover:text-foreground transition-colors">
                    Contacto
                  </span>
                </div>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
