export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export const buttonBaseStyles =
  'inline-flex items-center justify-center font-sans font-semibold rounded-[var(--radius-control)] transition-colors duration-150 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[hsl(var(--focus-ring))] focus-visible:ring-offset-[hsl(var(--surface-app))] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none';

export const buttonVariantStyles: Record<ButtonVariant, string> = {
  primary:
    'bg-[hsl(var(--action-primary))] text-[hsl(var(--action-primary-content))] hover:bg-[hsl(var(--action-accent))] border border-transparent shadow-xs',
  secondary:
    'bg-[hsl(var(--surface-secondary))] text-foreground border border-border hover:bg-[hsl(var(--surface-muted))] hover:text-foreground',
  ghost:
    'bg-transparent text-muted-foreground border border-transparent hover:bg-[hsl(var(--surface-secondary))] hover:text-foreground active:bg-[hsl(var(--surface-muted))]',
};

export const buttonSizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-11 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2.5',
};

export const iconButtonSizeStyles: Record<ButtonSize, string> = {
  sm: 'h-8 w-8 p-0 text-xs',
  md: 'h-11 w-11 p-0 text-sm',
  lg: 'h-12 w-12 p-0 text-base',
};
