'use client';

import { useState } from 'react';
import TopHeader from './TopHeader';
import Sidebar from './Sidebar';

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
        <div className="flex-1 flex flex-col">
          <main className="flex-grow w-full">{children}</main>
          <footer className="border-t border-border mt-auto bg-card">
            <div className="max-w-7xl mx-auto px-6 py-8">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-muted-foreground text-sm">
                  © 2025 BiwengerStats. Análisis avanzado de Euroliga.
                </p>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
