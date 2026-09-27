'use client';

import { useId } from 'react';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme, type ThemePreference } from '@/contexts/ThemeContext';

const options = [
  { value: 'system', label: 'Sistema', description: 'Seguir el dispositivo', icon: Monitor },
  { value: 'dark', label: 'Oscuro', description: 'Tema oscuro', icon: Moon },
  { value: 'light', label: 'Claro', description: 'Tema claro', icon: Sun },
] satisfies Array<{ value: ThemePreference; label: string; description: string; icon: typeof Sun }>;

export function ThemePreferenceControl() {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const id = useId();

  return (
    <fieldset className="min-w-0 text-foreground" aria-describedby={`${id}-help`}>
      <legend className="mb-3 text-base font-semibold">Tema</legend>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map(({ value, label, description, icon: Icon }) => (
          <label
            key={value}
            className="relative flex min-h-20 cursor-pointer items-center gap-3 rounded-[var(--radius-control)] border border-[hsl(var(--control-border))]! bg-[hsl(var(--control-surface))] p-4 text-[hsl(var(--control-content))] has-checked:border-ring! has-checked:bg-secondary focus-within:outline-2 focus-within:outline-solid focus-within:outline-offset-2 focus-within:outline-ring"
          >
            <input
              type="radio"
              name={`${id}-theme`}
              value={value}
              checked={theme === value}
              onChange={() => setTheme(value)}
              aria-labelledby={`${id}-${value}-label`}
              aria-describedby={`${id}-${value}-description`}
              className="h-4 w-4 shrink-0 accent-[hsl(var(--action-primary))]"
            />
            <Icon size={20} aria-hidden="true" className="shrink-0" />
            <span className="min-w-0">
              <span id={`${id}-${value}-label`} className="block text-sm font-semibold">
                {label}
              </span>
              <span
                id={`${id}-${value}-description`}
                className="block text-xs text-muted-foreground"
              >
                {description}
              </span>
            </span>
          </label>
        ))}
      </div>
      <p id={`${id}-help`} className="mt-3 text-sm text-muted-foreground">
        {theme === 'system'
          ? `Según tu dispositivo, ahora se usa el tema ${resolvedTheme === 'dark' ? 'oscuro' : 'claro'}.`
          : 'Se aplica al instante y se guarda en este dispositivo.'}
      </p>
    </fieldset>
  );
}
