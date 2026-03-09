'use client';

import React, { useState } from 'react';
import { Swords } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';

function getCellColor(record) {
  if (!record || record.duels === 0) return 'bg-transparent border-transparent text-zinc-700';
  if (record.wins > record.losses)
    return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
  if (record.losses > record.wins) return 'bg-red-500/10 text-red-400 border-red-500/20';
  return 'bg-zinc-700/20 text-zinc-300 border-zinc-700/30';
}

function formatEuro(value) {
  if (!value) return '0';
  const abs = Math.abs(value);
  if (abs >= 1000000) return (abs / 1000000).toFixed(1) + 'M';
  if (abs >= 1000) return (abs / 1000).toFixed(0) + 'k';
  return Math.round(abs).toLocaleString('es-ES');
}

export default function BiddingDuelsMatrixCard({ data }) {
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
                Borde dorado = menor margen medio (+{formatEuro(lowestAvgMargin)}€)
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
                      className={`text-[10px] md:text-xs font-medium ${colors.text} text-center truncate w-full px-1`}
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
                        className={`text-[10px] md:text-xs font-medium ${userColors.text} text-right whitespace-nowrap`}
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

                      return (
                        <div
                          key={key}
                          className={`relative p-0.5 min-h-10.5 rounded-md border flex items-center justify-center transition-all duration-200 ${getCellColor(record)} ${record?.duels ? 'cursor-pointer hover:brightness-110' : ''} ${isMostCompetitive ? 'ring-2 ring-amber-400/80 shadow-[0_0_0_1px_rgba(251,191,36,0.25)]' : ''} ${isHovered ? 'z-120 scale-105 shadow-lg' : ''}`}
                          onMouseEnter={() => record?.duels && setHoveredCell(key)}
                          onMouseLeave={() => setHoveredCell(null)}
                        >
                          {record?.duels ? (
                            <div className="flex items-center justify-center gap-1 font-mono text-sm opacity-90">
                              <span
                                className={record.wins > record.losses ? 'font-bold text-base' : ''}
                              >
                                {record.wins}
                              </span>
                              <span className="opacity-30 text-xs">-</span>
                              <span
                                className={record.losses > record.wins ? 'font-bold text-base' : ''}
                              >
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
                                  <span className="text-zinc-500 uppercase text-[9px]">Vict</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-zinc-300 font-bold text-lg">
                                    {record.duels}
                                  </span>
                                  <span className="text-zinc-500 uppercase text-[9px]">Duelos</span>
                                </div>
                                <div className="flex flex-col items-center">
                                  <span className="text-red-400 font-bold text-lg">
                                    {record.losses}
                                  </span>
                                  <span className="text-zinc-500 uppercase text-[9px]">Der</span>
                                </div>
                              </div>
                              <div className="mt-2 text-center text-[10px] text-zinc-400">
                                Margen medio: +{formatEuro(record.avg_margin)}€
                              </div>
                              {isMostCompetitive ? (
                                <div className="mt-1 text-center text-[10px] font-semibold text-amber-400">
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
