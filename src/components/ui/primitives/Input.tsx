import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { type = 'text', className, ...props },
  ref
) {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        'h-11 w-full rounded-[var(--radius-control)] border border-[hsl(var(--control-border))]! bg-[hsl(var(--control-surface))] px-3.5 py-2 font-sans text-sm text-[hsl(var(--control-content))] placeholder:text-[hsl(var(--control-placeholder))] transition-colors duration-150 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--focus-ring))] focus-visible:border-transparent disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[hsl(var(--surface-muted))] aria-invalid:border-[hsl(var(--status-danger))]! aria-invalid:focus-visible:ring-[hsl(var(--status-danger))]',
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';
