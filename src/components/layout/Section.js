'use client';

import { useEffect, useId } from 'react';
import { useSections } from './SectionContext';
import { FadeIn } from '@/components/ui';

/**
 * Section component with split-color title and background support
 * Title format: "MI TEMPORADA" -> "MI" in white, "TEMPORADA" in gradient
 *
 * @param {string} title - Section title (first word white, rest gradient)
 * @param {ReactNode} children - Section content
 * @param {number} delay - Animation delay in ms
 * @param {string} background - CSS class for background (e.g., 'section-base', 'section-raised')
 */
export default function Section({
  title,
  id,
  subtitle,
  children,
  delay = 0,
  background = '',
  className = '',
}) {
  const { registerSection, unregisterSection } = useSections();
  const reactId = useId();

  // Handle empty title gracefully
  const words = title ? title.split(' ') : [];
  const firstWord = words[0] || '';
  const restWords = words.slice(1).join(' ');

  // Generate ID from title if not provided
  const sectionId =
    id ||
    (title
      ? title
          .toLowerCase()
          .replace(/\s+/g, '-') // Replace spaces with -
          .replace(/[^\w\u00C0-\u00FF-]/g, '') // Remove non-word chars (keeping accents)
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '') // Remove accents
      : 'section-' + reactId);

  // Register section on mount
  useEffect(() => {
    registerSection({ id: sectionId, title });
    return () => unregisterSection(sectionId);
  }, [sectionId, title, registerSection, unregisterSection]);

  return (
    <FadeIn delay={delay}>
      <section
        id={sectionId}
        className={`${background} px-4 sm:px-6 lg:px-8 py-10 scroll-mt-16 ${className}`}
      >
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="space-y-1">
            <h2 className="font-display text-5xl tracking-wide">
              <span className="text-foreground">{firstWord}</span>
              {restWords && <span className="text-gradient"> {restWords}</span>}
            </h2>
            {subtitle && <p className="text-xl text-gradient font-medium">{subtitle}</p>}
          </div>
          {children}
        </div>
      </section>
    </FadeIn>
  );
}
