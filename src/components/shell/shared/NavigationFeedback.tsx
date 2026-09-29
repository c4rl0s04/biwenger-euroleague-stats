'use client';

import Link, { type LinkProps } from 'next/link';
import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type MouseEvent,
  type ReactNode,
} from 'react';

export interface PendingNavigation {
  href: string;
  label: string;
  sourcePathname: string;
}

export interface NavigationFeedbackContextValue {
  beginNavigation: (href: string, label?: string) => void;
  isNavigatingTo: (href: string) => boolean;
  pendingNavigation: PendingNavigation | null;
}

const NavigationFeedbackContext = createContext<NavigationFeedbackContextValue>({
  beginNavigation: () => {},
  isNavigatingTo: () => false,
  pendingNavigation: null,
});

export function NavigationFeedbackProvider({
  children,
  presentationMode,
}: {
  children: ReactNode;
  presentationMode: 'desktop' | 'phone';
}) {
  const pathname = usePathname();
  const [pendingNavigation, setPendingNavigation] = useState<PendingNavigation | null>(null);

  const beginNavigation = useCallback((href: string, label = 'la página') => {
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

  const value = useMemo<NavigationFeedbackContextValue>(
    () => ({
      beginNavigation,
      isNavigatingTo: (href: string) => {
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
        className={`navigation-progress ${presentationMode === 'phone' ? 'navigation-progress-phone' : ''} ${activeNavigation ? 'navigation-progress-visible' : ''}`}
      >
        <span className="sr-only">
          {activeNavigation ? `Cargando ${activeNavigation.label}` : ''}
        </span>
        <span className="navigation-progress-bar" aria-hidden="true" />
      </div>
    </NavigationFeedbackContext.Provider>
  );
}

export function useNavigationFeedback(): NavigationFeedbackContextValue {
  return useContext(NavigationFeedbackContext);
}

export interface NavigationLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof LinkProps>, LinkProps {
  navigationLabel?: string;
  className?: string;
  children: ReactNode;
}

export function NavigationLink({
  href,
  navigationLabel,
  onClick,
  children,
  ...props
}: NavigationLinkProps) {
  const { beginNavigation, isNavigatingTo } = useNavigationFeedback();
  const pending = isNavigatingTo(String(href));

  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
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

    beginNavigation(String(href), navigationLabel);
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
