'use client';

import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { ReactNode } from 'react';

import type { HomeActivityFilter } from '@/lib/home/contracts';

interface HomeActivityContextValue {
  filter: HomeActivityFilter;
  selectFilter: (filter: HomeActivityFilter) => void;
}

const HomeActivityContext = createContext<HomeActivityContextValue | null>(null);

export default function MobileHomeActivityProvider({
  initialFilter,
  children,
}: {
  initialFilter: HomeActivityFilter;
  children: ReactNode;
}) {
  const [filter, setFilter] = useState(initialFilter);

  const selectFilter = useCallback((nextFilter: HomeActivityFilter) => {
    setFilter(nextFilter);
    const url = new URL(window.location.href);
    if (nextFilter === 'all') url.searchParams.delete('activity');
    else url.searchParams.set('activity', nextFilter);
    window.history.replaceState(
      window.history.state,
      '',
      `${url.pathname}${url.search}${url.hash}`
    );
  }, []);

  const value = useMemo(() => ({ filter, selectFilter }), [filter, selectFilter]);

  return <HomeActivityContext.Provider value={value}>{children}</HomeActivityContext.Provider>;
}

export function useMobileHomeActivity() {
  const context = useContext(HomeActivityContext);
  if (!context) throw new Error('MobileHomeActivityProvider is required');
  return context;
}
