import { Trophy } from 'lucide-react';

export default function StandingsTable({ standings }) {
  if (!standings || standings.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground">No hay clasificación disponible.</div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/5 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
            <th className="px-4 py-3 text-center w-12">Pos</th>
            <th className="px-4 py-3">Equipo</th>
            <th className="px-4 py-3 text-center">PJ</th>
            <th className="px-4 py-3 text-center hidden sm:table-cell">V</th>
            <th className="px-4 py-3 text-center hidden sm:table-cell">E</th>
            <th className="px-4 py-3 text-center hidden sm:table-cell">D</th>
            <th className="px-4 py-3 text-center hidden md:table-cell">GF</th>
            <th className="px-4 py-3 text-center hidden md:table-cell">GC</th>
            <th className="px-4 py-3 text-center font-bold text-primary">Pts</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {standings.map((row) => (
            <tr key={row.user_id} className="hover:bg-white/5 transition-colors">
              <td className="px-4 py-3 text-center font-medium">
                {row.position === 1 ? (
                  <Trophy size={14} className="text-amber-500 mx-auto" />
                ) : (
                  <span className="text-muted-foreground">{row.position}</span>
                )}
              </td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden bg-secondary border border-white/10">
                    {row.user_icon ? (
                      <img
                        src={
                          row.user_icon.startsWith('http')
                            ? row.user_icon
                            : `https://cdn.biwenger.com/${row.user_icon}`
                        }
                        alt={row.user_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold bg-primary/20 text-primary">
                        {row.user_name?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="font-medium text-foreground">{row.user_name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-center text-muted-foreground">
                {row.won + row.lost + (row.drawn || 0)}
              </td>
              <td className="px-4 py-3 text-center hidden sm:table-cell text-muted-foreground">
                {row.won}
              </td>
              <td className="px-4 py-3 text-center hidden sm:table-cell text-muted-foreground">
                {row.drawn || 0}
              </td>
              <td className="px-4 py-3 text-center hidden sm:table-cell text-muted-foreground">
                {row.lost}
              </td>
              <td className="px-4 py-3 text-center hidden md:table-cell text-muted-foreground">
                {row.scored}
              </td>
              <td className="px-4 py-3 text-center hidden md:table-cell text-muted-foreground">
                {row.against}
              </td>
              <td className="px-4 py-3 text-center font-bold text-lg text-primary">{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
