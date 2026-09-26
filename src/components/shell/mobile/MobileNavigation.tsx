'use client';

import { usePathname } from 'next/navigation';
import { LoaderCircle, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import { MOBILE_PRIMARY_ITEMS, isNavigationItemActive } from '../shared/navigation';
import { NavigationLink, useNavigationFeedback } from '../shared/NavigationFeedback';
import { MobileMoreMenu } from './MobileMoreMenu';

export interface MobileNavigationProps {
  className?: string;
}

export function MobileNavigation({ className = '' }: MobileNavigationProps) {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { isNavigatingTo } = useNavigationFeedback();
  const primaryActive = MOBILE_PRIMARY_ITEMS.some((item) =>
    isNavigationItemActive(pathname, item.href)
  );

  return (
    <>
      <nav aria-label="Navegación principal móvil" className={`mobile-bottom-nav ${className}`}>
        <div className="mobile-bottom-nav-inner">
          {MOBILE_PRIMARY_ITEMS.map((item) => {
            const active = isNavigationItemActive(pathname, item.href);
            const pending = isNavigatingTo(item.href);
            return (
              <NavigationLink
                key={item.href}
                href={item.href}
                navigationLabel={item.shortName || item.name}
                aria-current={active ? 'page' : undefined}
                className={`mobile-nav-item ${active ? 'mobile-nav-item-active' : ''} ${
                  pending ? 'mobile-nav-item-pending' : ''
                }`}
              >
                {pending ? (
                  <LoaderCircle className="mobile-nav-spinner" size={21} aria-hidden="true" />
                ) : (
                  <item.icon size={21} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                )}
                <span>{item.shortName || item.name}</span>
              </NavigationLink>
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
      <MobileMoreMenu isOpen={isMoreOpen} onClose={() => setIsMoreOpen(false)} />
    </>
  );
}

export default MobileNavigation;
