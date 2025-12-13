import { getPlayerDetails } from '@/lib/db';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, TrendingUp, Shield, User, DollarSign } from 'lucide-react';
import { getScoreColor } from '@/lib/utils/format';

export const dynamic = 'force-dynamic';

export default async function PlayerPage({ params }) {
  const { id } = await params;
  const player = getPlayerDetails(id);

  if (!player) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-white mb-4">Jugador no encontrado</h1>
        <Link href="/" className="text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2">
          <ArrowLeft className="w-4 h-4" /> Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header / Back Link */}
      <div>
        <Link href="/" className="text-slate-400 hover:text-white flex items-center gap-2 mb-4 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver al dashboard
        </Link>
      </div>

      {/* Main Profile Card */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 md:p-8">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Player Image / Avatar Placeholder */}
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full bg-slate-800 flex items-center justify-center border-4 border-slate-700 shrink-0">
             {player.img ? (
                <Image 
                  src={player.img} 
                  alt={player.name} 
                  fill
                  sizes="(max-width: 768px) 96px, 128px"
                  className="rounded-full object-cover"
                />
             ) : (
                <User className="w-12 h-12 text-slate-500" />
             )}
          </div>

          {/* Player Info */}
          <div className="flex-1 space-y-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-1">{player.name}</h1>
              <div className="flex items-center gap-3 text-slate-400">
                <span className="font-medium text-slate-300">{player.team}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-600"></span>
                <span>{player.position}</span>
              </div>
            </div>

            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                  <DollarSign className="w-3 h-3" /> Valor
                </div>
                <div className="text-white font-bold text-lg">{(player.price / 1000000).toFixed(2)}M</div>
                <div className={`text-xs ${player.price_increment >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {player.price_increment > 0 ? '+' : ''}{(player.price_increment / 1000).toFixed(0)}k
                </div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" /> Media
                </div>
                <div className="text-white font-bold text-lg">{player.season_avg}</div>
                <div className="text-xs text-slate-500">pts/partido</div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Total
                </div>
                <div className="text-white font-bold text-lg">{player.total_points}</div>
                <div className="text-xs text-slate-500">puntos</div>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-3 border border-slate-700/50">
                <div className="text-slate-500 text-xs mb-1 flex items-center gap-1">
                  <User className="w-3 h-3" /> Dueño
                </div>
                <div className="text-white font-bold text-lg truncate" title={player.owner_name || 'Libre'}>
                  {player.owner_name || 'Libre'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Matches */}
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
        <h2 className="text-xl font-bold text-white mb-4">Historial de Partidos</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800/50">
              <tr>
                <th className="px-4 py-3 rounded-l-lg">Jornada</th>
                <th className="px-4 py-3 text-center">Puntos</th>
                <th className="px-4 py-3 text-center">Minutos</th>
                <th className="px-4 py-3 text-center">Pts. Real</th>
                <th className="px-4 py-3 text-center">Reb</th>
                <th className="px-4 py-3 text-center">T3</th>
                <th className="px-4 py-3 text-center">Asist</th>
                <th className="px-4 py-3 text-center rounded-r-lg">Robos</th>
              </tr>
            </thead>
            <tbody>
              {player.recentMatches && player.recentMatches.length > 0 ? (
                player.recentMatches.map((match) => (
                  <tr key={match.round_id} className="border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30">
                    <td className="px-4 py-3 font-medium text-white">{match.round_name || `Jornada ${match.round_id}`}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-1 rounded font-bold ${getScoreColor(match.fantasy_points)}`}>
                        {match.fantasy_points}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center text-slate-300">{match.minutes_played}'</td>
                    <td className="px-4 py-3 text-center text-slate-300 font-bold">{match.points_scored || '-'}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{match.rebounds || '-'}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{match.triples || '-'}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{match.assists || '-'}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{match.steals || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                    No hay datos recientes disponibles
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
