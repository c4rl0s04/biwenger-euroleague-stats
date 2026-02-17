import { UserAvatar } from '@/components/ui';

export function StatsTable({ data, title, type = 'global' }) {
  if (!data || data.length === 0) return null;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-white/5 bg-card/20 backdrop-blur-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
        <h3 className="text-lg font-bold text-white font-display ml-2">{title}</h3>
        <span className="text-xs text-zinc-500 uppercase font-medium tracking-wider px-3 py-1 rounded-full bg-black/20">
          {type === 'league' ? 'Solo Ligas' : 'Global (Todo)'}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-zinc-500 border-b border-white/5">
              <th className="px-6 py-3 font-medium w-16 text-center">#</th>
              <th className="px-6 py-3 font-medium">Jugador</th>
              {type === 'league' && (
                <th className="px-4 py-3 font-bold text-right text-indigo-400">Pts</th>
              )}
              <th className="px-4 py-3 font-medium text-right text-green-400">V</th>
              <th className="px-4 py-3 font-medium text-right text-zinc-400">E</th>
              <th className="px-4 py-3 font-medium text-right text-red-400">D</th>
              <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">GF</th>
              <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">GC</th>
              <th className="px-4 py-3 font-medium text-right hidden sm:table-cell">DIF</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {data.map((row, index) => (
              <tr key={row.id} className="hover:bg-white/5 transition-colors group">
                <td className="px-6 py-3 text-center text-zinc-500 font-mono text-xs">
                  {index + 1}
                </td>
                <td className="px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-zinc-800 shrink-0 border border-white/10 group-hover:border-white/20 transition-colors">
                      {row.icon ? (
                        <img
                          src={
                            row.icon.startsWith('http')
                              ? row.icon
                              : `https://cdn.biwenger.com/${row.icon}`
                          }
                          alt={row.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs font-bold text-zinc-500">
                          {row.name.substring(0, 2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <span className="font-medium text-zinc-200 group-hover:text-white transition-colors truncate max-w-[150px] sm:max-w-none">
                      {row.name}
                    </span>
                  </div>
                </td>

                {type === 'league' && (
                  <td className="px-4 py-3 text-right font-black text-indigo-400 font-mono text-base">
                    {row.points}
                  </td>
                )}

                <td className="px-4 py-3 text-right text-green-400/90 font-medium">{row.won}</td>
                <td className="px-4 py-3 text-right text-zinc-400/90 font-medium">{row.drawn}</td>
                <td className="px-4 py-3 text-right text-red-400/90 font-medium">{row.lost}</td>

                <td className="px-4 py-3 text-right text-zinc-400 hidden sm:table-cell">
                  {type === 'league' ? row.scored : row.gf}
                </td>
                <td className="px-4 py-3 text-right text-zinc-500 hidden sm:table-cell">
                  {type === 'league' ? row.against : row.ga}
                </td>

                <td
                  className={`px-4 py-3 text-right font-medium hidden sm:table-cell ${
                    (type === 'league' ? row.scored : row.gf) -
                      (type === 'league' ? row.against : row.ga) >
                    0
                      ? 'text-emerald-500'
                      : 'text-rose-500'
                  }`}
                >
                  {(type === 'league' ? row.scored : row.gf) -
                    (type === 'league' ? row.against : row.ga) >
                  0
                    ? '+'
                    : ''}
                  {(type === 'league' ? row.scored : row.gf) -
                    (type === 'league' ? row.against : row.ga)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
