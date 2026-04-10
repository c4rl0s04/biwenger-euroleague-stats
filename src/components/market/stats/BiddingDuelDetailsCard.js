'use client';

import { Swords, X, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import PlayerImage from '@/components/ui/PlayerImage';
import { useApiData } from '@/lib/hooks/useApiData';
import { getColorForUser } from '@/lib/constants/colors';

import { formatEuro } from '@/lib/utils/currency';

function formatDate(value) {
  if (!value) return 'Fecha no disponible';

  const parsedDate = new Date(value);
  if (!Number.isNaN(parsedDate.getTime())) {
    return new Intl.DateTimeFormat('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(parsedDate);
  }

  const normalizedValue = String(value).split('T')[0]?.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(normalizedValue)) {
    const [year, month, day] = normalizedValue.split('-');
    return `${day}-${month}-${year}`;
  }

  return value;
}

function buildPairKey(selectedDuel) {
  if (!selectedDuel?.user?.id || !selectedDuel?.opponent?.id) return null;
  return [selectedDuel.user.id, selectedDuel.opponent.id].sort((a, b) => a - b).join('-');
}

export default function BiddingDuelDetailsCard({ selectedDuel, onClear }) {
  const pairKey = buildPairKey(selectedDuel);
  const userId = selectedDuel?.user?.id;
  const opponentId = selectedDuel?.opponent?.id;

  const {
    data: duelDetails = [],
    loading,
    error,
  } = useApiData(
    () =>
      selectedDuel ? `/api/market/duels/details?userId=${userId}&opponentId=${opponentId}` : null,
    {
      dependencies: [userId, opponentId],
      skip: !selectedDuel,
      cacheKey: pairKey ? `market-duel-${pairKey}` : null,
    }
  );

  if (!selectedDuel) return null;

  const { user, opponent, record } = selectedDuel;
  const userColors = getColorForUser(user.id, user.name, user.color_index);
  const opponentColors = getColorForUser(opponent.id, opponent.name, opponent.color_index);

  return (
    <div className="animate-in fade-in-0 slide-in-from-top-2 duration-300">
      <ElegantCard
        title="Detalle del Duelo"
        icon={Swords}
        color="indigo"
        info="Lista completa de subastas disputadas entre los dos managers seleccionados en la matriz."
      >
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className={`font-semibold ${userColors.text}`}>{user.name}</span>
                <ChevronRight className="h-4 w-4 text-zinc-500" />
                <span className={`font-semibold ${opponentColors.text}`}>{opponent.name}</span>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-300">
                  {record?.wins ?? 0} victorias
                </span>
                <span className="rounded-full border border-red-500/20 bg-red-500/10 px-3 py-1 font-semibold text-red-300">
                  {record?.losses ?? 0} derrotas
                </span>
                <span className="rounded-full border border-zinc-700 bg-zinc-900/70 px-3 py-1 font-semibold text-zinc-200">
                  {record?.duels ?? 0} duelos
                </span>
                <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 font-semibold text-amber-300">
                  Margen medio +{formatEuro(record?.avg_margin ?? 0)}€
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClear}
              className="inline-flex cursor-pointer items-center gap-2 self-start rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
              Cerrar detalle
            </button>
          </div>

          {loading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, index) => (
                <div
                  key={index}
                  className="h-16 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
                />
              ))}
            </div>
          ) : error ? (
            <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-5 text-sm text-red-200">
              No se pudo cargar el detalle del duelo.
            </div>
          ) : duelDetails.length === 0 ? (
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 px-4 py-5 text-sm text-zinc-400">
              No hay subastas registradas para este cruce.
            </div>
          ) : (
            <div className="divide-y divide-zinc-800/80">
              {duelDetails.map((duel) => {
                const winnerColors = getColorForUser(
                  duel.winner_id,
                  duel.winner_name,
                  duel.winner_color_index
                );
                const runnerColors = getColorForUser(
                  duel.runner_id,
                  duel.runner_name,
                  duel.runner_color_index
                );

                return (
                  <div
                    key={duel.transfer_id}
                    className="relative overflow-hidden py-3 first:pt-0 last:pb-0"
                  >
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex w-32 items-end justify-end overflow-hidden">
                      <PlayerImage
                        src={duel.player_img}
                        alt={duel.player_name}
                        width={128}
                        height={128}
                        className="h-full w-full scale-110 object-contain object-top translate-y-2 origin-top"
                        fallbackSize={24}
                        bgClassName="bg-transparent"
                      />
                    </div>

                    <div className="relative flex items-center gap-3">
                      <div className="min-w-0 flex-1 pr-28">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 pr-2">
                            <Link
                              href={`/players/${duel.player_id}`}
                              className="inline-block truncate text-sm font-semibold text-white transition-all hover:text-primary hover:scale-[1.02] active:scale-95"
                            >
                              {duel.player_name}
                            </Link>
                            <div className="mt-0.5 text-[11px] text-zinc-500 text-xs">
                              {formatDate(duel.transfer_date)}
                            </div>
                          </div>

                          <div className="mr-1 flex shrink-0 flex-wrap justify-end gap-1.5 text-[11px]">
                            <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5 font-semibold text-emerald-300">
                              {formatEuro(duel.winning_bid)}€
                            </span>
                            <span className="rounded-full border border-zinc-700 bg-zinc-950/70 px-2 py-0.5 font-semibold text-zinc-300">
                              {formatEuro(duel.second_bid)}€
                            </span>
                            <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-2 py-0.5 font-semibold text-amber-300">
                              +{formatEuro(duel.margin)}€
                            </span>
                          </div>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px]">
                          <span className="text-zinc-500">Ganador</span>
                          <span className={`truncate font-semibold ${winnerColors.text}`}>
                            {duel.winner_name}
                          </span>
                          <span className="text-zinc-700">vs</span>
                          <span className="text-zinc-500">Segundo</span>
                          <span className={`truncate font-semibold ${runnerColors.text}`}>
                            {duel.runner_name}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </ElegantCard>
    </div>
  );
}
