'use client';

import { Swords, X, ChevronRight } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { useApiData } from '@/lib/hooks/useApiData';
import { getColorForUser } from '@/lib/constants/colors';

function formatEuro(value) {
  return new Intl.NumberFormat('es-ES').format(Math.round(value || 0));
}

function formatDate(value) {
  if (!value) return 'Fecha no disponible';
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
              className="inline-flex items-center gap-2 self-start rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
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
                  className="h-20 animate-pulse rounded-2xl border border-zinc-800 bg-zinc-900/60"
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
            <div className="space-y-3">
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
                    className="rounded-2xl border border-zinc-800/80 bg-zinc-900/70 p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                      <div className="min-w-0">
                        <div className="text-base font-semibold text-white">{duel.player_name}</div>
                        <div className="mt-1 text-xs text-zinc-500">
                          Fichaje #{duel.transfer_id} · {formatDate(duel.transfer_date)}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-1 font-semibold text-emerald-300">
                          Ganadora {formatEuro(duel.winning_bid)}€
                        </span>
                        <span className="rounded-full border border-zinc-700 bg-zinc-950/70 px-3 py-1 font-semibold text-zinc-300">
                          Segunda {formatEuro(duel.second_bid)}€
                        </span>
                        <span className="rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 font-semibold text-amber-300">
                          +{formatEuro(duel.margin)}€
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-3 md:grid-cols-2">
                      <div className="rounded-xl border border-emerald-500/10 bg-emerald-500/5 px-3 py-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          Ganador
                        </div>
                        <div className={`mt-1 font-semibold ${winnerColors.text}`}>
                          {duel.winner_name}
                        </div>
                      </div>
                      <div className="rounded-xl border border-zinc-700 bg-zinc-950/70 px-3 py-3">
                        <div className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
                          Segundo postor
                        </div>
                        <div className={`mt-1 font-semibold ${runnerColors.text}`}>
                          {duel.runner_name}
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
