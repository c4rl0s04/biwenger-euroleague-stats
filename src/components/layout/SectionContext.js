'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SectionContext = createContext({
  sections: [],
  registerSection: () => {},
  unregisterSection: () => {},
});

export function SectionProvider({ children }) {
  // State for sections
  const [sections, setSections] = useState([]);
  const pathname = usePathname();

  // Note: We rely on the unmount cleanup of individual sections to remove them.
  // We do NOT clear on pathname change here because child effects run before parent effects,
  // causing the list to be cleared immediately after registration.

  const registerSection = useCallback((section) => {
    setSections((prev) => {
      // Avoid duplicates
      if (prev.some((s) => s.id === section.id)) return prev;
      // Perform insertion sort or just append (order depends on render order usually)
      return [...prev, section];
    });
  }, []);

  const unregisterSection = useCallback((id) => {
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, []);

  // Sort sections by their position in the DOM to ensure correct order
  // This is a robust way to handle React's non-deterministic render order
  useEffect(() => {
    if (sections.length > 0) {
      const sorted = [...sections].sort((a, b) => {
        const elA = document.getElementById(a.id);
        const elB = document.getElementById(b.id);
        if (!elA || !elB) return 0;
        return elA.compareDocumentPosition(elB) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1;
      });

      // Only update if order actually changed to avoid infinite loops
      const isDifferent = sorted.some((s, i) => s.id !== sections[i].id);
      if (isDifferent) {
        // Defer validation to next tick to avoid synchronous set-state warning
        requestAnimationFrame(() => setSections(sorted));
      }
    }
  }, [sections.length]); // Re-sort when count changes

  return (
    <SectionContext.Provider value={{ sections, registerSection, unregisterSection }}>
      {children}
    </SectionContext.Provider>
  );
}

export const useSections = () => useContext(SectionContext);
