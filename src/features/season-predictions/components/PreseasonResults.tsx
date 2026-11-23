import { Badge, Card, CardContent, CardTitle } from '@/components/ui/foundation';
import type { PreseasonResultsView } from '../models/hub';
import type { PredictionAnswers, PredictionQuestion } from '../models/questions';

const STATUS_LABEL = {
  pending: 'Pendiente',
  provisional: 'Provisional',
  final: 'Definitivo',
} as const;

/** Viewer's preseason points per question once the window is locked. */
export function PreseasonResults({
  questions,
  answers,
  results,
}: {
  questions: PredictionQuestion[];
  answers: PredictionAnswers;
  results: PreseasonResultsView;
}) {
  const ordered = [...questions].sort((a, b) => a.order - b.order);
  return (
    <Card className="p-0!">
      <CardContent className="space-y-4 p-4 sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <CardTitle as="h3">Tus puntos de pretemporada</CardTitle>
          <p className="text-2xl font-bold tabular-nums text-[hsl(var(--content-primary))]">
            {results.points} <span className="text-sm font-medium">pts</span>
          </p>
        </div>
        {results.provisional ? (
          <p className="text-sm text-[hsl(var(--content-secondary))]">
            Puntos provisionales: así quedarías si la temporada terminara hoy.
          </p>
        ) : null}
        <ul className="divide-y divide-[hsl(var(--border-default))]">
          {ordered.map((question) => {
            const result = results.questions[question.id];
            if (!result) return null;
            return (
              <li
                key={question.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:gap-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[hsl(var(--content-primary))]">
                    {question.prompt}
                  </p>
                  <p className="break-words text-xs text-[hsl(var(--content-secondary))]">
                    {answers[question.id] ? 'Respuesta guardada' : 'Sin respuesta'} · Resultado:{' '}
                    {result.actual ?? 'pendiente'}
                  </p>
                </div>
                {result.scored ? (
                  <div className="flex items-center gap-2">
                    <Badge>{STATUS_LABEL[result.status]}</Badge>
                    <span className="min-w-12 text-right text-sm font-semibold tabular-nums">
                      {result.points} pts
                    </span>
                  </div>
                ) : (
                  <Badge>Sin puntos</Badge>
                )}
              </li>
            );
          })}
        </ul>
      </CardContent>
    </Card>
  );
}
