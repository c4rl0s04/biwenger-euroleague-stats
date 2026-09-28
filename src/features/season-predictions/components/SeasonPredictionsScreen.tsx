'use client';

import { useState } from 'react';
import { PageHeader, SectionHeader } from '@/components/ui/foundation';
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
}: {
  seasonName: string;
  options: SeasonPredictionOptions;
}) {
  const [answers, setAnswers] = useState<Partial<Record<PredictionQuestionId, string>>>({});

  return (
    <div className="mx-auto w-full max-w-7xl space-y-10 px-4 pb-28 pt-8 sm:px-6 sm:pt-12 lg:space-y-14 lg:px-8 lg:pt-16">
      <PageHeader
        context={seasonName}
        title="Predicciones de temporada"
        description="Elige quién crees que destacará al terminar la temporada."
      />
      <p className="max-w-2xl rounded-[var(--radius-control)] border border-[hsl(var(--border-default))] bg-[hsl(var(--surface-secondary))] px-4 py-3 text-sm leading-relaxed text-[hsl(var(--content-secondary))]">
        Esta página es una demostración. Tus elecciones no se guardan y desaparecerán al recargarla.
      </p>
      <div className="grid gap-10 lg:grid-cols-2 lg:gap-8">
        {PREDICTION_SECTIONS.map((section) => (
          <section
            key={section.id}
            id={section.id}
            aria-label={section.title}
            className="min-w-0 space-y-5 scroll-mt-24"
          >
            <SectionHeader title={section.title} description={section.description} />
            <div className="grid gap-4">
              {PREDICTION_QUESTIONS.filter((question) => question.section === section.id)
                .sort((a, b) => a.order - b.order)
                .map((question) => (
                  <PredictionQuestionCard
                    key={question.id}
                    question={question}
                    options={options}
                    value={answers[question.id] ?? null}
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
          </section>
        ))}
      </div>
    </div>
  );
}
