'use client';

import { useEffect } from 'react';
import { useSections } from '@/components/shell/shared/SectionContext';

/** Registers a hub section in the desktop sidebar; the matching element carries the id. */
export function HubSectionAnchor({ id, title }: { id: string; title: string }) {
  const { registerSection, unregisterSection } = useSections();
  useEffect(() => {
    registerSection({ id, title });
    return () => unregisterSection(id);
  }, [registerSection, unregisterSection, id, title]);
  return null;
}
