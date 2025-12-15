'use client';

import { Calendar, House, Plane } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';
import { getScoreColor } from '@/lib/utils/format';

export default function PlayerHistoryCard({ recentMatches, playerTeam, className = '' }) {
  // Helper to normalize team names for comparison
  const normalize = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';
  
  return (
    <PremiumCard title="Historial de Partidos" icon={Calendar} color="blue" className={className}>
        <div className="overflow-x-auto -mx-6 px-6">
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-400 uppercase bg-slate-800/30 border-b border-slate-700/50">
                <tr>
                    <th className="px-4 py-3">Jornada</th>
                    <th className="px-4 py-3">Rival</th>
                    <th className="px-4 py-3 text-center">Pts</th>
                    <th className="px-4 py-3 text-center">Min</th>
                    <th className="px-4 py-3 text-center hidden md:table-cell">RP</th>
                    <th className="px-4 py-3 text-center hidden md:table-cell">Reb</th>
                    <th className="px-4 py-3 text-center hidden md:table-cell">Ast</th>
                    <th className="px-4 py-3 text-center hidden lg:table-cell">T2</th>
                    <th className="px-4 py-3 text-center hidden lg:table-cell">T3</th>
                    <th className="px-4 py-3 text-center hidden lg:table-cell">TL</th>
                    <th className="px-4 py-3 text-center hidden lg:table-cell">Tap</th>
                    <th className="px-4 py-3 text-center hidden lg:table-cell">Per</th>
                    <th className="px-4 py-3 text-center">Val</th>
                </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                {recentMatches && recentMatches.length > 0 ? (
                    recentMatches.map((match) => {
                        // Determine Rival
                        const pTeamNorm = normalize(playerTeam);
                        const hTeamNorm = normalize(match.home_team);
                        const isHome = pTeamNorm && hTeamNorm && (pTeamNorm === hTeamNorm || pTeamNorm.includes(hTeamNorm) || hTeamNorm.includes(pTeamNorm));
                        
                        const rivalName = isHome ? match.away_team : match.home_team;
                        
                        // Icons
                        const RivalIcon = isHome ? House : Plane;
                        const rivalIconColor = isHome ? 'text-blue-400' : 'text-slate-400';

                         // Check if player played (minutes or points exist)
                        const played = match.minutes_played > 0 || match.fantasy_points !== null;

                        return (
                    <tr key={match.round_id} className={`hover:bg-slate-700/10 transition-colors group ${!played ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 font-medium text-slate-300 group-hover:text-white transition-colors">
                            {match.round_name || `Jornada ${match.round_id}`}
                            <div className="text-[10px] text-slate-500 md:hidden">{match.match_date ? new Date(match.match_date).toLocaleDateString() : ''}</div>
                        </td>
                        <td className="px-4 py-3">
                             <div className="flex items-center gap-2">
                                <div className={`p-1 rounded bg-slate-800/50 ${rivalIconColor}`}>
                                    <RivalIcon className="w-3 h-3" />
                                </div>
                                <span className="text-slate-300 truncate max-w-[120px] md:max-w-none" title={rivalName}>
                                    {rivalName || '-'}
                                </span>
                             </div>
                        </td>
                        {played ? (
                            <>
                                <td className="px-4 py-3 text-center">
                                    <span className={`inline-block w-8 py-1 rounded font-bold text-xs ${getScoreColor(match.fantasy_points)}`}>
                                        {match.fantasy_points}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-center text-slate-400">{match.minutes_played}'</td>
                                <td className="px-4 py-3 text-center font-bold text-slate-300 hidden md:table-cell">{match.points_scored || 0}</td>
                                <td className="px-4 py-3 text-center text-slate-400 hidden md:table-cell">{match.rebounds || 0}</td>
                                <td className="px-4 py-3 text-center text-slate-400 hidden md:table-cell">{match.assists || 0}</td>
                                
                                {/* Advanced Columns */}
                                <td className="px-4 py-3 text-center text-slate-500 text-xs hidden lg:table-cell">
                                    {match.two_points_made}/{match.two_points_attempted}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-500 text-xs hidden lg:table-cell">
                                     {match.three_points_made}/{match.three_points_attempted}
                                </td>
                                 <td className="px-4 py-3 text-center text-slate-500 text-xs hidden lg:table-cell">
                                     {match.free_throws_made}/{match.free_throws_attempted}
                                </td>
                                <td className="px-4 py-3 text-center text-slate-400 hidden lg:table-cell">{match.blocks || 0}</td>
                                <td className="px-4 py-3 text-center text-slate-400 hidden lg:table-cell">{match.turnovers || 0}</td>
        
                                <td className="px-4 py-3 text-center text-blue-400 font-medium">{match.valuation || 0}</td>
                            </>
                        ) : (
                            // DNP State
                            <>
                                <td className="px-4 py-3 text-center"><span className="text-slate-600 font-mono">-</span></td>
                                <td className="px-4 py-3 text-center text-slate-600">-</td>
                                <td className="px-4 py-3 text-center text-slate-600 hidden md:table-cell">-</td>
                                <td className="px-4 py-3 text-center text-slate-600 hidden md:table-cell">-</td>
                                <td className="px-4 py-3 text-center text-slate-600 hidden md:table-cell">-</td>
                                <td className="px-4 py-3 text-center text-slate-600 hidden lg:table-cell">-</td>
                                <td className="px-4 py-3 text-center text-slate-600 hidden lg:table-cell">-</td>
                                <td className="px-4 py-3 text-center text-slate-600 hidden lg:table-cell">-</td>
                                <td className="px-4 py-3 text-center text-slate-600 hidden lg:table-cell">-</td>
                                <td className="px-4 py-3 text-center text-slate-600 hidden lg:table-cell">-</td>
                                <td className="px-4 py-3 text-center text-slate-600">-</td>
                            </>
                        )}
                    </tr>
                    );
                })
                ) : (
                    <tr>
                    <td colSpan="13" className="px-4 py-8 text-center text-slate-500 italic">
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
