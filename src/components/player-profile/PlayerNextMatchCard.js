'use client';

import { CalendarClock, MapPin } from 'lucide-react';
import { Card } from '@/components/ui';

export default function PlayerNextMatchCard({ nextMatch, playerTeam, className = '' }) {
  if (!nextMatch) {
    return (
      <Card
        title="Próximo Partido"
        icon={CalendarClock}
        color="orange"
        className={`h-full ${className}`}
      >
        <div className="flex items-center justify-center h-20 text-slate-500 text-sm italic">
          Sin partidos programados
        </div>
      </Card>
    );
  }

  const isHome = nextMatch.home_team === playerTeam;
  const opponent = isHome ? nextMatch.away_team : nextMatch.home_team;
  const dateObj = new Date(nextMatch.date);

  // Format Date: "Lun 21 Oct"
  const dateStr = dateObj.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  // Format Time: "20:45"
  const timeStr = dateObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });

  return (
    <Card
      title="Próximo Partido"
      icon={CalendarClock}
      color="orange"
      className={`h-full ${className}`}
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs text-orange-400 font-bold uppercase tracking-wider border border-orange-500/20 bg-orange-500/10 px-2 py-0.5 rounded">
            {nextMatch.round_name || 'Liga'}
          </div>
          <div className="text-xs text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {isHome ? 'En casa' : 'Visitante'}
          </div>
        </div>

        <div className="text-center">
          <div className="text-xs text-slate-500 uppercase mb-1">Contra</div>
          <div className="text-lg font-bold text-white truncate px-2">{opponent}</div>
        </div>

        <div className="flex justify-between items-end pt-2 border-t border-slate-700/30">
          <div className="text-center w-full">
            <div className="text-xl font-mono text-slate-200">{timeStr}</div>
            <div className="text-xs text-slate-400 capitalize">{dateStr}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
