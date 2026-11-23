import { EmptyState } from '@/components/ui/foundation';
import type { PhaseSummary } from '../models/hub';
import { phaseDescription, phaseStatusLabel } from './PhaseOverview';

/** Playoff phase status until the interactive bracket view replaces it. */
export function PlayoffsPhasePanel({ summary }: { summary: PhaseSummary }) {
  return (
    <EmptyState className="space-y-1 rounded-[var(--radius-surface)] border border-[hsl(var(--border-default))] bg-[hsl(var(--surface-secondary))] px-4 py-8">
      <p className="font-semibold text-[hsl(var(--content-primary))]">
        {phaseStatusLabel(summary)}
      </p>
      <p>{phaseDescription(summary)}</p>
    </EmptyState>
  );
}
