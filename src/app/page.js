import { getNextRound, getTopPlayers, getRecentTransfers, getStandings } from '../lib/database';
import Link from 'next/link';
import { Calendar, TrendingUp, Users, ArrowRight, Euro } from 'lucide-react';
import StandingsTable from '@/components/StandingsTable';

export const dynamic = 'force-dynamic';

export default function Dashboard() {
  const nextRound = getNextRound();
  const topPlayers = getTopPlayers(5);
  const transfers = getRecentTransfers(5);
  const standings = getStandings(); // Show all users

  return (
    <div className="space-y-8">
      {/* Hero Section: Next Round & Standings Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Next Round Card */}
        <div className="lg:col-span-1 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 flex flex-col justify-between relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Calendar className="w-24 h-24 text-orange-500" />
          </div>
          <div>
            <h2 className="text-slate-400 font-medium mb-1">Próxima Jornada</h2>
            {nextRound ? (
              <>
                <div className="text-3xl font-bold text-white mb-2">{nextRound.round_name}</div>
                <div className="text-orange-500 font-mono text-lg">
                  {new Date(nextRound.start_date).toLocaleDateString('es-ES', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </div>
              </>
            ) : (
              <div className="text-2xl font-bold text-white">Temporada Finalizada</div>
            )}
          </div>
          <div className="mt-6">
            <Link href="/matches" className="text-sm text-slate-300 hover:text-white flex items-center gap-2 transition-colors">
              Ver calendario completo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Standings Preview */}
        <div className="lg:col-span-2 bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-500" /> Clasificación
            </h2>
            <Link href="/standings" className="text-sm text-blue-400 hover:text-blue-300">Ver todo</Link>
          </div>
          <StandingsTable standings={standings} />
        </div>
      </div>

      {/* Top Players & Market */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Players */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" /> Top Jugadores
            </h2>
            <Link href="/players" className="text-sm text-green-400 hover:text-green-300">Ver todos</Link>
          </div>
          <div className="space-y-4">
            {topPlayers.map((player, index) => (
              <div key={player.id} className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/30 hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
                <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center text-lg font-bold text-white border-2 border-slate-600">
                  {index + 1}
                </div>
                <div className="flex-grow min-w-0">
                  <div className="font-medium text-white truncate">{player.name}</div>
                  <div className="text-xs text-slate-400">{player.team} · {player.position}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-green-400">{player.points} pts</div>
                  <div className="text-xs text-slate-500">{player.average} avg</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Transfers */}
        <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Euro className="w-5 h-5 text-yellow-500" /> Últimos Fichajes
            </h2>
            <Link href="/market" className="text-sm text-yellow-400 hover:text-yellow-300">Ir al mercado</Link>
          </div>
          <div className="space-y-0">
            {transfers.map((transfer) => (
              <div key={transfer.id} className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                    {transfer.player_name?.charAt(0) || '?'}
                   </div>
                  <div>
                    <div className="font-medium text-white text-sm">{transfer.player_name}</div>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <span className="text-red-400">{transfer.vendedor || 'Mercado'}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-green-400">{transfer.comprador}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white text-sm">{(transfer.precio / 1000000).toFixed(2)}M€</div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(transfer.timestamp * 1000).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
