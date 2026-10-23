'use client';

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';

/** Native top-layer disclosure: outside dismissal, Escape and focus return stay with the browser. */
export function Popover({
  label,
  trigger,
  children,
  className = '',
}: {
  label: string;
  trigger: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const id = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: Event) => {
      const panel = panelRef.current;
      if (event.type === 'scroll' && event.target instanceof Node && panel?.contains(event.target))
        return;
      if (panel?.matches(':popover-open')) panel.hidePopover();
    };
    window.addEventListener('scroll', dismiss, true);
    window.addEventListener('resize', dismiss);
    return () => {
      window.removeEventListener('scroll', dismiss, true);
      window.removeEventListener('resize', dismiss);
    };
  }, [open]);
  const [position, setPosition] = useState({ left: 8, top: 8 });
  return (
    <>
      <button
        type="button"
        ref={triggerRef}
        popoverTarget={id}
        aria-label={label}
        className={`rounded focus-visible:outline-2 focus-visible:outline-primary ${className}`}
        onClick={() => {
          const rect = triggerRef.current?.getBoundingClientRect();
          if (rect)
            setPosition({
              left: Math.max(8, Math.min(rect.left, window.innerWidth - 272)),
              top: Math.max(
                8,
                window.innerHeight - rect.bottom > 180 ? rect.bottom + 6 : rect.top - 164
              ),
            });
        }}
      >
        {trigger}
      </button>
      <div
        id={id}
        ref={panelRef}
        onToggle={(event) => setOpen(event.currentTarget.matches(':popover-open'))}
        popover="auto"
        aria-label={label}
        style={position}
        className="fixed inset-auto z-50 m-0 max-h-[70dvh] w-64 max-w-[calc(100vw-1rem)] overflow-auto rounded-[var(--radius-control)] border border-border bg-popover p-3 text-sm text-foreground shadow-xl"
      >
        {children}
      </div>
    </>
  );
}
