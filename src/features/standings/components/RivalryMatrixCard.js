'use client';

import { Swords } from 'lucide-react';
import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import React from 'react';

export default function RivalryMatrixCard() {
  const { data: rawData, loading } = useApiData('/api/standings/advanced?type=rivalry-matrix');

  // Parse data
  const users = rawData?.users || [];
  const matrix = rawData?.matrix || {};

  // Sort users alphabetically for the matrix headers
  const sortedUsers = [...users].sort((a, b) => a.name.localeCompare(b.name));

  const getCellColor = (record) => {
    // If no record exists, make it transparent
    if (!record) return 'bg-transparent border-transparent';

    // Logic for cells with matches
    if (record.wins > record.losses)
      return 'bg-green-500/10 text-green-400 font-bold border-green-500/20';
    if (record.losses > record.wins)
      return 'bg-red-500/10 text-red-400 font-bold border-red-500/20';
    return 'bg-slate-700/20 text-slate-400 border-slate-700/30';
  };

  return (
    <Card
      title="Matriz Head-to-Head"
      icon={Swords}
      color="indigo"
      loading={loading}
      className="md:col-span-2 lg:col-span-2 h-full flex flex-col"
      tooltip="Resultados directos entre todos los managers."
    >
      {!loading && users.length > 0 ? (
        <div className="flex flex-col h-full overflow-hidden">
          {/* Header Description */}
          <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
            <p className="text-xs text-slate-300 font-medium italic px-2">
              Resultados directos (<span className="text-green-400 font-bold">W</span>-
              <span className="text-slate-400 font-bold">D</span>-
              <span className="text-red-400 font-bold">L</span>).
            </p>
          </div>

          <div className="flex-1 overflow-auto scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-transparent pr-1 pb-1">
            <div className="w-full p-2">
              <div
                className="grid gap-1 w-full"
                // Increased min-width to 80px to fit LARGE numbers
                style={{
                  gridTemplateColumns: `auto repeat(${sortedUsers.length}, minmax(80px, 1fr))`,
                }}
              >
                {/* Top-Left Corner (Spacer) */}
                <div className="sticky top-0 left-0 z-30 p-2">
                  <div className="w-full h-full" />
                </div>

                {/* Column Headers (Top) */}
                {sortedUsers.map((opponent) => {
                  const oppColors = getColorForUser(
                    opponent.id,
                    opponent.name,
                    opponent.color_index
                  );
                  return (
                    <div
                      key={`col-${opponent.id}`}
                      className="sticky top-0 z-20 flex items-end justify-center pb-2"
                    >
                      <span
                        className={`text-[10px] md:text-xs font-medium ${oppColors.text} text-center truncate w-full px-1`}
                      >
                        {opponent.name}
                      </span>
                    </div>
                  );
                })}

                {/* Matrix Content */}
                {sortedUsers.map((user, rowIndex) => {
                  const userColors = getColorForUser(user.id, user.name, user.color_index);
                  return (
                    <React.Fragment key={user.id}>
                      {/* Row Header (Left) */}
                      <div className="sticky left-0 z-20 flex items-center justify-end pr-3 py-1">
                        <span
                          className={`text-[10px] md:text-xs font-medium ${userColors.text} text-right whitespace-nowrap`}
                        >
                          {user.name}
                        </span>
                      </div>

                      {/* Cells */}
                      {sortedUsers.map((opponent, colIndex) => {
                        // Diagonal (Self)
                        if (user.id === opponent.id) {
                          return (
                            <div key={`cell-${user.id}-${opponent.id}`} className="p-0.5">
                              <div className="w-full h-full bg-slate-800/10 rounded-sm"></div>
                            </div>
                          );
                        }

                        const record = matrix[user.id]?.[opponent.id];

                        return (
                          <div
                            key={`cell-${user.id}-${opponent.id}`}
                            // Increased min-h to 48px for very large text
                            className={`
                              relative p-0.5 min-h-[48px] rounded-md border flex items-center justify-center transition-all duration-200 ease-out
                              ${getCellColor(record)}
                              
                              /* HOVER EFFECTS */
                              ${
                                record
                                  ? 'hover:brightness-110 hover:scale-[1.02] hover:shadow-sm cursor-pointer'
                                  : ''
                              }
                            `}
                          >
                            {/* Cell Content (Wins - Draws - Losses) */}
                            {record && (
                              <div className="flex items-baseline justify-center gap-1.5 font-display opacity-95 leading-none translate-y-0.5">
                                <span
                                  className={`text-lg sm:text-xl ${
                                    record.wins > record.losses
                                      ? 'font-black text-2xl sm:text-3xl drop-shadow-md'
                                      : 'font-bold'
                                  }`}
                                >
                                  {record.wins}
                                </span>
                                <span className="opacity-40 text-sm font-bold">-</span>
                                <span className="text-slate-400 text-lg sm:text-xl font-bold">
                                  {record.ties}
                                </span>
                                <span className="opacity-40 text-sm font-bold">-</span>
                                <span
                                  className={`text-lg sm:text-xl ${
                                    record.losses > record.wins
                                      ? 'font-black text-2xl sm:text-3xl drop-shadow-md'
                                      : 'font-bold'
                                  }`}
                                >
                                  {record.losses}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center text-slate-400 py-8">Cargando matriz de rivalidad...</div>
      )}
    </Card>
  );
}
