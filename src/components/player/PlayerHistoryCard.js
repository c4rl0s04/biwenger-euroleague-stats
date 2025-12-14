'use client';

import { Calendar } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';
import { getScoreColor } from '@/lib/utils/format';

export default function PlayerHistoryCard({ recentMatches, className = '' }) {
  return (
    <PremiumCard title="Historial de Partidos" icon={Calendar} color="blue" className={className}>
        <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/30 border-b border-slate-700/50">
                <tr>
                    <th className="px-4 py-3">Jornada</th>
                    <th className="px-4 py-3 text-center">Pts Fantasy</th>
                    <th className="px-4 py-3 text-center">Min</th>
                    <th className="px-4 py-3 text-center">Pts Real</th>
                    <th className="px-4 py-3 text-center">Reb</th>
                    <th className="px-4 py-3 text-center">Ast</th>
                    <th className="px-4 py-3 text-center">Val</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                {recentMatches && recentMatches.length > 0 ? (
                    recentMatches.map((match) => (
                    <tr key={match.round_id} className="hover:bg-slate-700/10 transition-colors group">
                        <td className="px-4 py-3 font-medium text-slate-300 group-hover:text-white transition-colors">
                            {match.round_name || `Jornada ${match.round_id}`}
                        </td>
                        <td className="px-4 py-3 text-center">
                            <span className={`inline-block w-8 py-1 rounded font-bold text-xs ${getScoreColor(match.fantasy_points)}`}>
                                {match.fantasy_points}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-center text-slate-400">{match.minutes_played}'</td>
                        <td className="px-4 py-3 text-center font-bold text-slate-300">{match.points_scored || '-'}</td>
                        <td className="px-4 py-3 text-center text-slate-400">{match.rebounds || '-'}</td>
                        <td className="px-4 py-3 text-center text-slate-400">{match.assists || '-'}</td>
                        <td className="px-4 py-3 text-center text-blue-400 font-medium">{match.valuation || '-'}</td>
                    </tr>
                    ))
                ) : (
                    <tr>
                    <td colSpan="7" className="px-4 py-8 text-center text-slate-500 italic">
                        No hay datos recientes disponibles
                    </td>
                    </tr>
                )}
                </tbody>
            </table>
        </div>
    </PremiumCard>
  );
}
