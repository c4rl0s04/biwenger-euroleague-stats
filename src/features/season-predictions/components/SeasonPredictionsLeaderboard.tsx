import { Avatar, Badge, EmptyState } from '@/components/ui/foundation';
import type { LeaderboardRow } from '../models/leaderboard';

const points = (value: number | null) => (value == null ? '—' : value);

/** Combined porra table: total plus the per-phase breakdown. */
export function SeasonPredictionsLeaderboard({ rows }: { rows: LeaderboardRow[] | null }) {
  if (!rows)
    return (
      <EmptyState className="py-6">
        La clasificación aparecerá al cerrar la pretemporada. Hasta entonces nadie ve las respuestas
        de los demás.
      </EmptyState>
    );
  if (!rows.length)
    return <EmptyState className="py-6">Nadie guardó predicciones esta temporada.</EmptyState>;
  return (
    <div className="overflow-x-auto rounded-[var(--radius-surface)] border border-[hsl(var(--border-default))]">
      <table className="w-full min-w-[28rem] text-sm">
        <caption className="sr-only">Clasificación de la porra de la temporada</caption>
        <thead className="bg-[hsl(var(--surface-secondary))] text-left text-xs uppercase tracking-wide text-[hsl(var(--content-secondary))]">
          <tr>
            <th scope="col" className="px-3 py-2">
              #
            </th>
            <th scope="col" className="px-3 py-2">
              Mánager
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Pretemporada
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Playoffs
            </th>
            <th scope="col" className="px-3 py-2 text-right">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-[hsl(var(--border-default))]">
          {rows.map((row) => (
            <tr key={row.userId}>
              <td className="px-3 py-2 tabular-nums">{row.rank}</td>
              <td className="px-3 py-2">
                <span className="flex items-center gap-2">
                  <Avatar
                    src={row.image ?? undefined}
                    alt=""
                    size="sm"
                    fallback={row.name.slice(0, 1)}
                  />
                  <span className="font-medium">{row.name}</span>
                </span>
              </td>
              <td className="px-3 py-2 text-right tabular-nums">{points(row.phases.preseason)}</td>
              <td className="px-3 py-2 text-right tabular-nums">{points(row.phases.playoffs)}</td>
              <td className="px-3 py-2 text-right font-semibold tabular-nums">
                {row.total}
                {row.provisional ? (
                  <Badge className="ml-2 align-middle" title="Puede cambiar">
                    Prov.
                  </Badge>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
