import { Badge, Card, CardContent, CardDescription, CardTitle } from '@/components/ui/foundation';
import type { PhaseSummary } from '../models/hub';
import type { PredictionPhase } from '../models/phases';

export function phaseStatusLabel(summary: PhaseSummary) {
  if (summary.window === 'open') return 'Abierta';
  if (summary.window === 'not-open') return 'Próximamente';
  if (summary.results === 'final') return 'Resultados definitivos';
  if (summary.results === 'provisional') return 'Resultados provisionales';
  return 'Cerrada';
}

export function phaseDescription(summary: PhaseSummary) {
  if (summary.window === 'open' && summary.locksAtLabel)
    return `Puedes cambiar tus respuestas hasta el ${summary.locksAtLabel}.`;
  if (summary.window === 'locked') return 'Respuestas bloqueadas; los puntos se calculan solos.';
  return summary.phase === 'preseason'
    ? 'Se abre antes de empezar la temporada.'
    : 'Se abre al terminar la temporada regular, con los cruces reales.';
}

/** Desktop overview of the season's prediction phases; the active one is highlighted. */
export function PhaseOverview({
  phases,
  activePhase,
}: {
  phases: PhaseSummary[];
  activePhase: PredictionPhase;
}) {
  return (
    <ul className="grid gap-4 sm:grid-cols-2">
      {phases.map((summary) => {
        const active = summary.phase === activePhase;
        return (
          <li key={summary.phase}>
            <a
              href={`#${summary.phase}`}
              className="block h-full rounded-[var(--radius-surface)] focus-visible:outline-2 focus-visible:outline-[hsl(var(--focus-ring))]"
              aria-current={active ? 'step' : undefined}
            >
              <Card
                className={`h-full p-0! ${active ? 'border-[hsl(var(--action-primary)/0.5)]!' : ''}`}
              >
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <CardTitle as="h2">{summary.title}</CardTitle>
                    <Badge variant={active ? 'accent' : 'neutral'}>
                      {phaseStatusLabel(summary)}
                    </Badge>
                  </div>
                  <CardDescription>{phaseDescription(summary)}</CardDescription>
                </CardContent>
              </Card>
            </a>
          </li>
        );
      })}
    </ul>
  );
}
