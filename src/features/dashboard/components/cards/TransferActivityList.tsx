'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Avatar, EmptyState } from '@/components/ui/foundation';
import { AnimatedNumber } from '@/components/ui';
import type { RecentTransfer } from '@/features/market/public';
import { getManagerTextColor } from '@/lib/competition/public';

function Counterparty({
  id,
  name,
  colorIndex,
}: {
  id: string | null;
  name: string | null;
  colorIndex: number | null;
}) {
  const className = 'rounded font-medium focus-visible:outline-2 focus-visible:outline-primary';
  const style = { color: getManagerTextColor(id, name, colorIndex) };
  return id != null ? (
    <Link href={`/user/${id}`} className={className} style={style}>
      {name || 'Usuario'}
    </Link>
  ) : (
    <span className="text-muted-foreground">{name || 'Mercado'}</span>
  );
}

/** An event stream with independent player, seller and buyer links, never a ranked row. */
export function TransferActivityList({ transfers }: { transfers: readonly RecentTransfer[] }) {
  if (!transfers.length) return <EmptyState>No hay fichajes recientes</EmptyState>;
  return (
    <ul className="m-0 list-none space-y-4 p-0" data-stat-list="transfer-activity">
      {transfers.map((transfer, index) => (
        <li
          key={transfer.id ?? `${transfer.player_id}:${transfer.timestamp}:${index}`}
          className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-x-3 gap-y-2 border-l-2 border-border pl-3"
        >
          <div className="flex min-w-0 items-center gap-2">
            <Avatar fallback={transfer.player_name?.slice(0, 1) || '?'} size="sm" />
            {transfer.player_id != null ? (
              <Link
                href={`/player/${transfer.player_id}`}
                className="min-w-0 truncate rounded text-sm font-semibold text-foreground focus-visible:outline-2 focus-visible:outline-primary"
                title={transfer.player_name ?? undefined}
              >
                {transfer.player_name}
              </Link>
            ) : (
              <span className="text-sm text-foreground">{transfer.player_name || 'Jugador'}</span>
            )}
          </div>
          <div className="self-center text-right text-sm font-semibold tabular-nums">
            <AnimatedNumber value={transfer.precio ?? 0} suffix="€" duration={0.8} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <Counterparty
              id={transfer.vendedor_id}
              name={transfer.vendedor}
              colorIndex={transfer.vendedor_color_index}
            />
            <ArrowRight size={12} className="shrink-0 text-muted-foreground" aria-hidden="true" />
            <Counterparty
              id={transfer.comprador_id}
              name={transfer.comprador}
              colorIndex={transfer.comprador_color_index}
            />
          </div>
          <div className="text-right text-xs text-muted-foreground">
            {new Date(Number(transfer.timestamp) * 1000).toLocaleDateString()}
          </div>
        </li>
      ))}
    </ul>
  );
}
