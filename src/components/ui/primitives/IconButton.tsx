import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import {
  buttonBaseStyles,
  buttonVariantStyles,
  iconButtonSizeStyles,
  type ButtonSize,
  type ButtonVariant,
} from './button-styles';

type BaseIconButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label' | 'aria-labelledby'
> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export type IconButtonProps = BaseIconButtonProps &
  (
    | { 'aria-label': string; 'aria-labelledby'?: string }
    | { 'aria-labelledby': string; 'aria-label'?: string }
  );

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'secondary', size = 'md', type = 'button', className, ...props },
  ref
) {
  if (process.env.NODE_ENV !== 'production') {
    if (!props['aria-label'] && !props['aria-labelledby']) {
      console.warn(
        'IconButton: Missing accessible name. Pass an `aria-label` or `aria-labelledby` attribute.'
      );
    }
  }

  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        buttonBaseStyles,
        buttonVariantStyles[variant],
        iconButtonSizeStyles[size],
        'shrink-0',
        className
      )}
      {...props}
    />
  );
});

IconButton.displayName = 'IconButton';
