'use client';

import { useState } from 'react';
import { MobileScreen, MobileScreenHeader } from '@/components/mobile/MobileScreen';
import { PageCanvas, PageHeader, PageSection, SectionHeader } from '@/components/ui/foundation';
import type { SeasonPredictionOptions } from '../models/options';
import {
  PREDICTION_QUESTIONS,
  PREDICTION_SECTIONS,
  type PredictionQuestionId,
} from '../models/questions';
import { PredictionQuestionCard } from './PredictionQuestionCard';

export function SeasonPredictionsScreen({
  seasonName,
  options,
  phone = false,
}: {
  seasonName: string;
  options: SeasonPredictionOptions;
  phone?: boolean;
}) {
  const [answers, setAnswers] = useState<Partial<Record<PredictionQuestionId, string>>>({});

  const demoNotice = (
    <p className="max-w-2xl rounded-[var(--radius-control)] border border-[hsl(var(--border-default))] bg-[hsl(var(--surface-secondary))] px-4 py-3 text-sm leading-relaxed text-[hsl(var(--content-secondary))]">
      Esta página es una demostración. Tus elecciones no se guardan y desaparecerán al recargarla.
    </p>
  );

  const sections = PREDICTION_SECTIONS.map((section, index) => (
    <PageSection
      key={section.id}
      id={section.id}
      aria-labelledby={`${section.id}-heading`}
      tone={index % 2 === 0 ? 'base' : 'alternate'}
      inset={phone ? 'phone' : 'responsive'}
    >
      <div className="space-y-5">
        <SectionHeader
          headingId={`${section.id}-heading`}
          title={section.title}
          description={section.description}
        />
        {section.subsection ? (
          <SectionHeader
            level={3}
            title={section.subsection.title}
            description={section.subsection.description}
          />
        ) : null}
        <div className="grid gap-4 lg:grid-cols-2">
          {PREDICTION_QUESTIONS.filter((question) => question.section === section.id)
            .sort((a, b) => a.order - b.order)
            .map((question) => (
              <PredictionQuestionCard
                key={question.id}
                question={question}
                options={options}
                value={answers[question.id] ?? null}
                headingLevel={section.subsection ? 4 : 3}
                onChange={(id) =>
                  setAnswers((current) => {
                    const next = { ...current };
                    if (id == null) delete next[question.id];
                    else next[question.id] = id;
                    return next;
                  })
                }
              />
            ))}
        </div>
      </div>
    </PageSection>
  ));

  if (phone) {
    return (
      <MobileScreen labelledBy="mobile-screen-title">
        <MobileScreenHeader eyebrow={seasonName} title="Predicciones" />
        <div className="py-6">{demoNotice}</div>
        {sections}
      </MobileScreen>
    );
  }

  return (
    <>
      <PageCanvas className="pb-8 lg:pb-10">
        <div className="space-y-10">
          <PageHeader
            title="Predicciones de temporada"
            description="Elige quién crees que destacará al terminar la temporada."
          />
          {demoNotice}
        </div>
      </PageCanvas>
      {sections}
    </>
  );
}
