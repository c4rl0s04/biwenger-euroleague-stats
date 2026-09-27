'use client';

import { usePathname } from 'next/navigation';
import { Download, Settings, X } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { IconButton } from '@/components/ui/foundation';
import {
  NAV_ITEMS,
  MOBILE_PRIMARY_ITEMS,
  MOBILE_NAV_CATEGORIES,
  isNavigationItemActive,
} from '../shared/navigation';
import { NavigationLink } from '../shared/NavigationFeedback';
import { GlobalSearch } from '../integrations/GlobalSearch';
import { SeasonSelector } from '../integrations/SeasonSelector';

export interface MobileMoreMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef?: React.RefObject<HTMLElement | null>;
}

export function MobileMoreMenu({ isOpen, onClose, triggerRef }: MobileMoreMenuProps) {
  const pathname = usePathname();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const secondaryItems = NAV_ITEMS.filter(
    (item) => !MOBILE_PRIMARY_ITEMS.some((primary) => primary.href === item.href)
  );

  const categories = MOBILE_NAV_CATEGORIES.map((category) => ({
    ...category,
    items: secondaryItems.filter((item) =>
      (category.hrefs as readonly string[]).includes(item.href)
    ),
  }));

  useEffect(() => {
    if (!isOpen) return undefined;

    previousFocusRef.current = (triggerRef?.current ||
      document.activeElement) as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    // Focus close button on open
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab' || !dialogRef.current) return;

      const focusable = dialogRef.current.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (!focusable.length) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      (triggerRef?.current || previousFocusRef.current)?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  return (
    <div className="mobile-more-layer">
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
            <h2 id="mobile-more-title" className="mt-1 text-3xl font-display text-foreground">
              Más secciones
            </h2>
          </div>
          <IconButton
            ref={closeButtonRef}
            variant="secondary"
            size="md"
            onClick={onClose}
            className="rounded-2xl"
            aria-label="Cerrar menú Más"
          >
            <X size={21} aria-hidden="true" />
          </IconButton>
        </header>

        <div className="px-5 pb-4 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Temporada
            </span>
            <SeasonSelector />
          </div>
          <GlobalSearch onClose={onClose} />
        </div>

        <nav aria-label="Resto de secciones" className="mobile-more-content">
          {categories.map((category) => (
            <section
              key={category.name}
              className="mobile-more-category"
              aria-labelledby={`mobile-more-${category.name}`}
            >
              <h3 id={`mobile-more-${category.name}`}>{category.name}</h3>
              <ul className="grid grid-cols-2 gap-2">
                {category.items.map((item) => {
                  const active = isNavigationItemActive(pathname, item.href);
                  return (
                    <li key={item.href}>
                      <NavigationLink
                        href={item.href}
                        navigationLabel={item.name}
                        onClick={onClose}
                        aria-current={active ? 'page' : undefined}
                        className={`mobile-more-link ${active ? 'mobile-more-link-active' : ''}`}
                      >
                        <item.icon size={20} aria-hidden="true" />
                        <span>{item.name}</span>
                      </NavigationLink>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}

          <div className="mt-4 grid grid-cols-2 gap-2 border-t border-border/40 pt-4">
            <NavigationLink
              href="/settings"
              navigationLabel="Ajustes"
              onClick={onClose}
              className="mobile-more-link"
            >
              <Settings size={20} aria-hidden="true" />
              <span>Ajustes</span>
            </NavigationLink>
            <NavigationLink
              href="/install"
              navigationLabel="Instalar"
              onClick={onClose}
              className="mobile-more-link"
            >
              <Download size={20} aria-hidden="true" />
              <span>Instalar</span>
            </NavigationLink>
          </div>
        </nav>
      </section>
    </div>
  );
}

export default MobileMoreMenu;
