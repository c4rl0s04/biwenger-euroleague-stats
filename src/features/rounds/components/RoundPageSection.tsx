'use client';

import { useEffect, type ReactNode } from 'react';
import { PageSection, SectionHeader } from '@/components/ui/foundation';
import { useSections } from '@/components/shell/shared/SectionContext';

export function RoundPageSection({
  title,
  id,
  background,
  children,
}: {
  title: string;
  id?: string;
  background?: string;
  delay?: number;
  children: ReactNode;
}) {
  const { registerSection, unregisterSection } = useSections();
  const sectionId =
    id ??
    title
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\u00C0-\u00FF-]/g, '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  useEffect(() => {
    registerSection({ id: sectionId, title });
    return () => unregisterSection(sectionId);
  }, [registerSection, unregisterSection, sectionId, title]);
  return (
    <PageSection
      id={sectionId}
      aria-labelledby={`${sectionId}-heading`}
      tone={background === 'section-raised' ? 'alternate' : 'base'}
    >
      <div className="space-y-6">
        <SectionHeader title={title} headingId={`${sectionId}-heading`} />
        {children}
      </div>
    </PageSection>
  );
}
