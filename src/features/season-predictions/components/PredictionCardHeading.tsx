import { Check } from 'lucide-react';
import { CardHeader, CardTitle } from '@/components/ui/foundation';
import type { PredictionQuestion } from '../models/questions';

export function PredictionCardHeading({
  question,
  answered,
  disabled,
  phone,
  level = 3,
}: {
  question: PredictionQuestion;
  answered: boolean;
  disabled: boolean;
  phone: boolean;
  level?: 3 | 4;
}) {
  return (
    <CardHeader>
      {phone ? (
        <div className="mb-1 flex w-full items-center justify-between gap-3">
          <span className="flex items-baseline gap-1.5">
            <span className="font-display! text-2xl leading-none text-[hsl(var(--action-primary))]">
              {String(question.order).padStart(2, '0')}
            </span>
            <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[hsl(var(--content-muted))]">
              Pregunta
            </span>
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold ${answered ? 'bg-[hsl(var(--action-primary)/0.12)] text-[hsl(var(--action-primary))]' : 'bg-[hsl(var(--surface-secondary))] text-[hsl(var(--content-muted))]'}`}
          >
            {answered ? <Check size={13} aria-hidden="true" /> : null}
            {answered ? 'Respondida' : disabled ? 'Sin respuesta' : 'Pendiente'}
          </span>
        </div>
      ) : null}
      <CardTitle
        id={`${question.id}-title`}
        as={level === 4 ? 'h4' : 'h3'}
        className={phone ? 'text-[1.08rem]! leading-snug' : 'text-lg!'}
      >
        {question.prompt}
      </CardTitle>
    </CardHeader>
  );
}
