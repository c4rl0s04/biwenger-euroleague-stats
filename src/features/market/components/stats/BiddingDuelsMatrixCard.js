'use client';

import React, { useState } from 'react';
import { Swords, Sparkles } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';

function getCellColor(record) {
  if (!record || record.duels === 0) return 'bg-transparent border-transparent text-zinc-700';
  if (record.wins > record.losses)
    return 'bg-emerald-500/25 text-emerald-300 border-emerald-500/40';
  if (record.losses > record.wins) return 'bg-red-500/25 text-red-300 border-red-500/40';
  return 'bg-zinc-700/30 text-zinc-200 border-zinc-700/40';
}

import { formatEuro } from '@/lib/utils/currency';

export default function BiddingDuelsMatrixCard({ data, onSelectDuel, selectedDuel }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  if (!data?.users?.length) return null;

  const users = [...data.users].sort((a, b) => a.name.localeCompare(b.name));
  const matrix = data.matrix || {};
  const competitiveMargins = Object.values(matrix)
    .flatMap((opponents) => Object.values(opponents || {}))
    .filter((record) => record?.duels >= 2 && record?.avg_margin > 0)
    .map((record) => record.avg_margin);
  const lowestAvgMargin = competitiveMargins.length > 0 ? Math.min(...competitiveMargins) : null;

  const isMostCompetitiveCell = (record) => {
    if (!record || record.duels < 2 || lowestAvgMargin === null) return false;
    return Math.abs(record.avg_margin - lowestAvgMargin) < 0.01;
  };

  return (
    <div className="h-full hover:scale-[1.01] transition-transform duration-200">
      <ElegantCard
        title="Duelos de Pujas"
        icon={Swords}
        color="indigo"
        info="Cara a cara en subastas disputadas. Cada celda usa como duelo la batalla entre ganador y segundo mejor postor."
      >
        <div className="flex h-full flex-col gap-4">
          <p className="text-xs text-zinc-400 italic px-1">
            Cada celda muestra <span className="text-emerald-400 font-bold">V</span>-
            <span className="text-red-400 font-bold">D</span> en duelos directos de subasta.
            {lowestAvgMargin !== null ? (
              <span className="ml-2 text-amber-400 not-italic font-semibold">
                Resplandor dorado = menor margen medio (+{formatEuro(lowestAvgMargin)}€)
              </span>
            ) : null}
          </p>

          <div className="relative flex-1 overflow-visible pr-1 pb-1">
            <div
              className="grid gap-1 h-full"
              style={{ gridTemplateColumns: `auto repeat(${users.length}, minmax(64px, 1fr))` }}
            >
              <div className="sticky top-0 left-0 z-30 p-2 bg-transparent" />

              {users.map((opponent) => {
                const colors = getColorForUser(opponent.id, opponent.name, opponent.color_index);
                return (
                  <div
                    key={`col-${opponent.id}`}
                    className="sticky top-0 z-20 flex items-end justify-center pb-2"
                  >
                    <span
                      className={`text-xs md:text-xs font-medium ${colors.text} text-center truncate w-full px-1`}
                    >
                      {opponent.name}
                    </span>
                  </div>
                );
              })}

              {users.map((user) => {
                const userColors = getColorForUser(user.id, user.name, user.color_index);

                return (
                  <React.Fragment key={user.id}>
                    <div className="sticky left-0 z-20 flex items-center justify-end pr-3 py-1">
                      <span
                        className={`text-xs md:text-xs font-medium ${userColors.text} text-right whitespace-nowrap`}
                      >
                        {user.name}
                      </span>
                    </div>

                    {users.map((opponent) => {
                      if (user.id === opponent.id) {
                        return (
                          <div key={`self-${user.id}`} className="p-0.5">
                            <div className="w-full h-full min-h-10.5 bg-zinc-800/10 rounded-sm" />
                          </div>
                        );
                      }

                      const record = matrix[user.id]?.[opponent.id];
                      const key = `${user.id}-${opponent.id}`;
                      const isHovered = hoveredCell === key;
                      const isMostCompetitive = isMostCompetitiveCell(record);
                      const isSelected =
                        selectedDuel?.user?.id === user.id &&
                        selectedDuel?.opponent?.id === opponent.id;

                      return (
                        <div
                          key={key}
                          className={`relative p-0.5 min-h-10.5 overflow-hidden rounded-md border flex items-center justify-center transition-all duration-200 ${getCellColor(record)} ${record?.duels ? 'cursor-pointer hover:brightness-110' : ''} ${isMostCompetitive ? 'border-amber-300/45 shadow-[0_0_22px_rgba(251,191,36,0.24),inset_0_0_0_1px_rgba(251,191,36,0.16)]' : ''} ${isSelected ? 'ring-2 ring-sky-400/80 shadow-[0_0_0_1px_rgba(56,189,248,0.25)]' : ''} ${isHovered ? 'z-120 scale-105 shadow-lg' : ''}`}
                          onMouseEnter={() => record?.duels && setHoveredCell(key)}
                          onMouseLeave={() => setHoveredCell(null)}
                          onClick={() =>
                            record?.duels &&
                            onSelectDuel?.({
                              user,
                              opponent,
                              record,
                            })
                          }
                          onKeyDown={(event) => {
                            if (!record?.duels) return;
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault();
                              onSelectDuel?.({ user, opponent, record });
                            }
                          }}
                          role={record?.duels ? 'button' : undefined}
                          tabIndex={record?.duels ? 0 : undefined}
                          aria-pressed={record?.duels ? isSelected : undefined}
                          aria-label={
                            record?.duels
                              ? `${user.name} contra ${opponent.name}, ${record.wins} victorias, ${record.losses} derrotas y ${record.duels} duelos`
                              : undefined
                          }
                        >
                          {isMostCompetitive ? (
                            <>
                              <div className="absolute inset-0 bg-linear-to-br from-amber-300/22 via-amber-400/8 to-transparent" />
                              <div className="absolute inset-x-1 bottom-1 h-px bg-linear-to-r from-transparent via-amber-300/90 to-transparent" />
                              <div className="absolute top-1 right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-300/18 text-amber-200 shadow-[0_0_10px_rgba(251,191,36,0.45)]">
                                <Sparkles className="h-2 w-2" />
                              </div>
                            </>
                          ) : null}

                          {record?.duels ? (
                            <div
                              className={`relative z-10 flex items-center justify-center gap-1 font-mono text-sm font-bold ${isMostCompetitive ? 'text-amber-50 drop-shadow-[0_0_10px_rgba(251,191,36,0.32)]' : ''}`}
                            >
                              <span
                                className={record.wins > record.losses ? 'text-emerald-300' : ''}
                              >
                                {record.wins}
                              </span>
                              <span className="opacity-30 text-xs">-</span>
                              <span className={record.losses > record.wins ? 'text-red-300' : ''}>
                                {record.losses}
                              </span>
                            </div>
                          ) : null}

                          {isHovered && record?.duels ? (
                            <div className="absolute z-999 bottom-full mb-2 left-1/2 -translate-x-1/2 bg-zinc-950 text-zinc-200 text-xs p-3 rounded-lg shadow-2xl border border-zinc-700 whitespace-nowrap min-w-37.5">
                              <div className="font-bold border-b border-zinc-700 pb-1 mb-1 text-center">
                                {user.name} vs {opponent.name}
                              </div>
                              <div className="flex justify-between gap-3 text-[11px]">
                                <div className="flex flex-col items-center">
                                  <span className="text-emerald-400 font-bold text-lg">
                                    {record.wins}
                                  </span>
                                  <span className="text-zinc-500 uppercase text-[10px]">Vict</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-zinc-300 font-bold text-lg">
                                    {record.duels}
                                  </span>
                                  <span className="text-zinc-500 uppercase text-[10px]">
                                    Duelos
                                  </span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-red-400 font-bold text-lg">
                                    {record.losses}
                                  </span>
                                  <span className="text-zinc-500 uppercase text-[10px]">Der</span>
                                </div>
                              </div>
                              <div className="mt-2 text-center text-xs text-zinc-400">
                                Margen medio: +{formatEuro(record.avg_margin)}€
                              </div>
                              {isMostCompetitive ? (
                                <div className="mt-1 text-center text-xs font-semibold text-amber-400">
                                  Duelo mas ajustado
                                </div>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
