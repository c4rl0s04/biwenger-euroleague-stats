import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import {
  buttonBaseStyles,
  buttonSizeStyles,
  buttonVariantStyles,
  type ButtonSize,
  type ButtonVariant,
} from './button-styles';

export type { ButtonSize, ButtonVariant };

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', type = 'button', className, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(
        buttonBaseStyles,
        buttonVariantStyles[variant],
        buttonSizeStyles[size],
        className
      )}
      {...props}
    />
  );
});

Button.displayName = 'Button';
