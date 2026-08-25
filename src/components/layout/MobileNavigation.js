'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Download, MoreHorizontal, Settings, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import SearchDropdown from './SearchDropdown';
import { MOBILE_PRIMARY_ITEMS, NAV_ITEMS, isNavigationItemActive } from './navigation';

function MoreSheet({ isOpen, onClose }) {
  const pathname = usePathname();
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const secondaryItems = NAV_ITEMS.filter(
    (item) => !MOBILE_PRIMARY_ITEMS.some((primary) => primary.href === item.href)
  );

  useEffect(() => {
    if (!isOpen) return undefined;
    previousFocusRef.current = document.activeElement;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) return;
      const focusable = dialogRef.current.querySelectorAll(
        'a[href], button:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="mobile-more-layer lg:hidden">
      <button
        type="button"
        className="mobile-more-backdrop"
        onClick={onClose}
        aria-label="Cerrar navegación"
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="mobile-more-title"
        className="mobile-more-sheet"
      >
        <div className="mobile-sheet-handle" aria-hidden="true" />
        <header className="flex items-center justify-between gap-4 px-5 pb-4 pt-2">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-primary">
              Navegación
            </p>
            <h2 id="mobile-more-title" className="mt-1 text-3xl text-white">
              Más secciones
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="mobile-sheet-close"
            aria-label="Cerrar menú Más"
          >
            <X size={21} aria-hidden="true" />
          </button>
        </header>

        <div className="px-5 pb-4">
          <SearchDropdown onClose={onClose} />
        </div>

        <nav aria-label="Resto de secciones" className="mobile-more-content">
          <ul className="grid grid-cols-2 gap-2">
            {secondaryItems.map((item) => {
              const active = isNavigationItemActive(pathname, item.href);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? 'page' : undefined}
                    className={`mobile-more-link ${active ? 'mobile-more-link-active' : ''}`}
                  >
                    <item.icon size={20} aria-hidden="true" />
                    <span>{item.name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-white/8 pt-4">
            <Link href="/settings" onClick={onClose} className="mobile-more-link">
              <Settings size={20} aria-hidden="true" /> Ajustes
            </Link>
            <Link href="/install" onClick={onClose} className="mobile-more-link">
              <Download size={20} aria-hidden="true" /> Instalar
            </Link>
          </div>
        </nav>
      </section>
    </div>
  );
}

export default function MobileNavigation() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const primaryActive = MOBILE_PRIMARY_ITEMS.some((item) =>
    isNavigationItemActive(pathname, item.href)
  );

  return (
    <>
      <nav aria-label="Navegación principal móvil" className="mobile-bottom-nav lg:hidden">
        <div className="mobile-bottom-nav-inner">
          {MOBILE_PRIMARY_ITEMS.map((item) => {
            const active = isNavigationItemActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={`mobile-nav-item ${active ? 'mobile-nav-item-active' : ''}`}
              >
                <item.icon size={21} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                <span>{item.shortName || item.name}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setIsMoreOpen(true)}
            aria-expanded={isMoreOpen}
            aria-haspopup="dialog"
            className={`mobile-nav-item ${!primaryActive ? 'mobile-nav-item-active' : ''}`}
          >
            <MoreHorizontal size={22} aria-hidden="true" />
            <span>Más</span>
          </button>
        </div>
      </nav>
      <MoreSheet isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </>
  );
}
