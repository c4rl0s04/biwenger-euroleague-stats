'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

type Notification = { id: number; message: string; tone: 'success' | 'error' };

export function useToast() {
  const [toast, setToast] = useState<Notification | null>(null);
  const sequence = useRef(0);
  const notify = useCallback((message: string, tone: Notification['tone']) => {
    setToast({ id: ++sequence.current, message, tone });
  }, []);
  const dismissToast = useCallback(() => setToast(null), []);
  return { toast, notify, dismissToast };
}

export function Toast({
  notification,
  onDismiss,
}: {
  notification: Notification | null;
  onDismiss: () => void;
}) {
  useEffect(() => {
    if (!notification) return;
    const timer = window.setTimeout(onDismiss, 2000);
    return () => window.clearTimeout(timer);
  }, [notification, onDismiss]);

  if (!notification) return null;
  return createPortal(
    <div className="pointer-events-none fixed inset-x-4 bottom-[calc(var(--mobile-nav-height,4rem)+env(safe-area-inset-bottom,0px)+7rem)] z-[80] flex justify-center md:inset-x-auto md:bottom-auto md:right-6 md:top-6">
      <p
        key={notification.id}
        role={notification.tone === 'error' ? 'alert' : 'status'}
        className="rounded-xl border border-border-default bg-surface-card px-4 py-3 text-sm text-content-primary shadow-lg"
      >
        {notification.message}
      </p>
    </div>,
    document.body
  );
}
