'use client';

import { BadgeEuro, CircleDot, Goal, Trophy, UserRoundSearch } from 'lucide-react';

import type { HomeActivityFilter } from '@/lib/home/contracts';
import { useMobileHomeActivity } from './MobileHomeActivityProvider';

const options: Array<{
  value: HomeActivityFilter;
  label: string;
  icon: typeof CircleDot;
}> = [
  { value: 'all', label: 'Todos', icon: CircleDot },
  { value: 'transfers', label: 'Fichajes', icon: UserRoundSearch },
  { value: 'rounds', label: 'Jornadas', icon: Trophy },
  { value: 'bonuses', label: 'Primas', icon: BadgeEuro },
  { value: 'results', label: 'Resultados', icon: Goal },
];

export default function HomeActivityFilterBar() {
  const { filter, selectFilter } = useMobileHomeActivity();

  return (
    <div className="mobile-home-filter-shell">
      <div className="mobile-home-filter-rail" role="group" aria-label="Filtrar actividad">
        {options.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            className={filter === value ? 'is-active' : undefined}
            aria-pressed={filter === value}
            onClick={() => selectFilter(value)}
          >
            <Icon size={15} aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}
