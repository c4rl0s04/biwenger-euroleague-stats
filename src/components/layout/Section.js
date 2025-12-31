'use client';

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
export default function Section({ title, subtitle, children, delay = 0, background = '' }) {
  // Split title into first word and rest
  const words = title.split(' ');
  const firstWord = words[0];
  const restWords = words.slice(1).join(' ');

  return (
    <FadeIn delay={delay}>
      <section className={`${background} px-4 sm:px-6 lg:px-8 py-10`}>
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
