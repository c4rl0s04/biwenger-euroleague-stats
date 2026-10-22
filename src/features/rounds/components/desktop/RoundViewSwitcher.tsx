'use client';

import { BrainCircuit, Star, User } from 'lucide-react';
import { Button } from '@/components/ui/foundation';

type RoundView = 'user' | 'user_ideal' | 'ideal';
const views = [
  { value: 'user', label: 'Alineación', icon: User },
  { value: 'user_ideal', label: 'Mi Ideal', icon: BrainCircuit },
  { value: 'ideal', label: 'Global', icon: Star },
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
      {views.map(({ value: view, label, icon: Icon }) => (
        <Button
          key={view}
          variant={value === view ? 'primary' : 'ghost'}
          aria-pressed={value === view}
          onClick={() => onChange(view)}
          className="min-w-0 gap-2 px-3 text-xs sm:px-5"
        >
          <Icon size={14} aria-hidden="true" />
          {label}
        </Button>
      ))}
    </div>
  );
}
