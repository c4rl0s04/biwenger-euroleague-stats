'use client';

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

export interface SectionItem {
  id: string;
  title?: string;
}

export interface SectionContextValue {
  sections: SectionItem[];
  registerSection: (section: SectionItem) => void;
  unregisterSection: (id: string) => void;
}

const SectionContext = createContext<SectionContextValue>({
  sections: [],
  registerSection: () => {},
  unregisterSection: () => {},
});

export function SectionProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<SectionItem[]>([]);

  const registerSection = useCallback((section: SectionItem) => {
    setSections((prev) => {
      if (prev.some((s) => s.id === section.id)) return prev;
      return [...prev, section];
    });
  }, []);

  const unregisterSection = useCallback((id: string) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  useEffect(() => {
    if (sections.length > 0) {
      const sorted = [...sections].sort((a, b) => {
        const elA = document.getElementById(a.id);
        const elB = document.getElementById(b.id);
        if (!elA || !elB) return 0;
        return elA.compareDocumentPosition(elB) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });

      const isDifferent = sorted.some((s, i) => s.id !== sections[i]?.id);
      if (isDifferent) {
        requestAnimationFrame(() => setSections(sorted));
      }
    }
  }, [sections]);

  return (
    <SectionContext.Provider value={{ sections, registerSection, unregisterSection }}>
      {children}
    </SectionContext.Provider>
  );
}

export function useSections(): SectionContextValue {
  return useContext(SectionContext);
}
