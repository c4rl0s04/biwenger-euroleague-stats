'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const NavigationFeedbackContext = createContext({
  beginNavigation: () => {},
  isNavigatingTo: () => false,
  pendingNavigation: null,
});

export function NavigationFeedbackProvider({ children }) {
  const pathname = usePathname();
  const [pendingNavigation, setPendingNavigation] = useState(null);

  const beginNavigation = useCallback((href, label = 'la página') => {
    if (!href || typeof window === 'undefined') return;

    const target = new URL(String(href), window.location.href);
    const currentTarget = `${window.location.pathname}${window.location.search}`;
    const nextTarget = `${target.pathname}${target.search}`;

    if (target.origin !== window.location.origin || nextTarget === currentTarget) return;

    setPendingNavigation({
      href: nextTarget,
      label,
      sourcePathname: window.location.pathname,
    });
  }, []);

  const activeNavigation =
    pendingNavigation?.sourcePathname === pathname ? pendingNavigation : null;

  useEffect(() => {
    if (!pendingNavigation) return undefined;
    const timeout = window.setTimeout(() => setPendingNavigation(null), 15_000);
    return () => window.clearTimeout(timeout);
  }, [pendingNavigation]);

  const value = useMemo(
    () => ({
      beginNavigation,
      isNavigatingTo: (href) => {
        if (!activeNavigation || typeof window === 'undefined') return false;
        const target = new URL(String(href), window.location.href);
        return `${target.pathname}${target.search}` === activeNavigation.href;
      },
      pendingNavigation: activeNavigation,
    }),
    [activeNavigation, beginNavigation]
  );

  return (
    <NavigationFeedbackContext.Provider value={value}>
      {children}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        aria-label={activeNavigation ? `Cargando ${activeNavigation.label}` : 'Navegación lista'}
        className={`navigation-progress ${activeNavigation ? 'navigation-progress-visible' : ''}`}
      >
        <span className="sr-only">
          {activeNavigation ? `Cargando ${activeNavigation.label}` : ''}
        </span>
        <span className="navigation-progress-bar" aria-hidden="true" />
      </div>
    </NavigationFeedbackContext.Provider>
  );
}

export function useNavigationFeedback() {
  return useContext(NavigationFeedbackContext);
}

export function NavigationLink({ href, navigationLabel, onClick, children, ...props }) {
  const { beginNavigation, isNavigatingTo } = useNavigationFeedback();
  const pending = isNavigatingTo(href);

  const handleClick = (event) => {
    onClick?.(event);
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey ||
      props.target === '_blank'
    ) {
      return;
    }

    beginNavigation(href, navigationLabel);
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      aria-busy={pending || undefined}
      data-navigation-label={navigationLabel}
      {...props}
    >
      {children}
    </Link>
  );
}
