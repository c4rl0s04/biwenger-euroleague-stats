'use client';

import { BrainCircuit, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/foundation';
import { cn } from '@/lib/utils';

type RoundView = 'user' | 'user_ideal' | 'ideal';
const views = [
  { value: 'user', label: 'Alineación', icon: User, selected: '', iconColor: 'text-primary' },
  {
    value: 'user_ideal',
    label: 'Mi Ideal',
    icon: BrainCircuit,
    selected: 'bg-emerald-700 text-white hover:bg-emerald-800 hover:text-white',
    iconColor: 'text-emerald-500',
  },
  {
    value: 'ideal',
    label: 'Global',
    icon: Star,
    selected: 'bg-purple-700 text-white hover:bg-purple-800 hover:text-white',
    iconColor: 'text-purple-500',
  },
] as const;

export function RoundViewSwitcher({
  value,
  onChange,
}: {
  value: RoundView;
  onChange: (value: RoundView) => void;
}) {
  return (
    <div
      role="group"
      aria-label="Vista de alineación"
      className="mx-auto grid w-full grid-cols-3 gap-1 rounded-xl border border-border bg-secondary p-1 sm:w-auto"
    >
      {views.map(({ value: view, label, icon: Icon, selected, iconColor }) => (
        <Button
          key={view}
          variant={value === view ? 'primary' : 'ghost'}
          aria-pressed={value === view}
          onClick={() => onChange(view)}
          className={cn('min-w-0 gap-2 px-3 text-xs sm:px-5', value === view && selected)}
        >
          <Icon size={14} aria-hidden="true" className={value !== view ? iconColor : undefined} />
          {label}
        </Button>
      ))}
    </div>
  );
}
