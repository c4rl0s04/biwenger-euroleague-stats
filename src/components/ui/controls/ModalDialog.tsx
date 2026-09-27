'use client';

import { useEffect, useEffectEvent, useRef, type HTMLAttributes, type RefObject } from 'react';

export type ModalDialogProps = Omit<HTMLAttributes<HTMLElement>, 'role'> & {
  as?: 'div' | 'section';
  onClose: () => void;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
} & (
    | { 'aria-label': string; 'aria-labelledby'?: string }
    | { 'aria-labelledby': string; 'aria-label'?: string }
  );

// Shared across mounted dialogs: only the top modal handles keys/focus, and scroll
// remains locked until the last dialog closes (including out-of-order unmounts).
const dialogs: HTMLElement[] = [];
let originalOverflow = '';

function tabStops(root: HTMLElement) {
  return Array.from(
    root.querySelectorAll<HTMLElement>(
      'a[href], button, input, select, textarea, [tabindex], [contenteditable="true"]'
    )
  ).filter(
    (element) =>
      element.tabIndex >= 0 &&
      !element.matches(':disabled') &&
      !element.closest('[hidden], [inert]') &&
      element.getClientRects().length > 0 &&
      getComputedStyle(element).visibility !== 'hidden'
  );
}

/**
 * Mounted modal interaction boundary. Consumers own open state, surface, close
 * control, backdrop, placement and (when needed) portal. No layout or animation.
 */
export function ModalDialog({
  as: Element = 'div',
  onClose,
  initialFocusRef,
  returnFocusRef,
  children,
  ...props
}: ModalDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const close = useEffectEvent(onClose);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const previousFocus = returnFocusRef?.current ?? (document.activeElement as HTMLElement | null);
    if (!dialogs.length) {
      originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    dialogs.push(dialog);
    const isTop = () => dialogs.at(-1) === dialog;
    const focusFirst = () => (tabStops(dialog)[0] ?? dialog).focus();
    (initialFocusRef?.current ?? tabStops(dialog)[0] ?? dialog).focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTop() || event.defaultPrevented) return;
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'Tab') {
        const stops = tabStops(dialog);
        const first = stops[0];
        const last = stops.at(-1);
        const active = document.activeElement;
        if (!first || !last) {
          event.preventDefault();
          dialog.focus();
        } else if (!dialog.contains(active) || active === dialog) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        } else if (event.shiftKey && active === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    const onFocus = (event: FocusEvent) => {
      if (isTop() && !dialog.contains(event.target as Node)) focusFirst();
    };
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('focusin', onFocus);
    return () => {
      const wasTop = isTop();
      dialogs.splice(dialogs.indexOf(dialog), 1);
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('focusin', onFocus);
      if (!dialogs.length) document.body.style.overflow = originalOverflow;
      if (wasTop && previousFocus?.isConnected) previousFocus.focus();
    };
  }, [initialFocusRef, returnFocusRef]);

  return (
    <Element
      {...props}
      ref={(element) => {
        dialogRef.current = element;
      }}
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      {children}
    </Element>
  );
}
