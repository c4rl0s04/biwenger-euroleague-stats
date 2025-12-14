'use client';

import { Trophy, Award } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { getShortTeamName } from '@/lib/utils/format';
import PremiumCard from '@/components/ui/PremiumCard';

export default function WeekMVPsCard() {
  const [mvps, setMvps] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/last-round-mvps')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setMvps(result.data || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching MVPs:', err);
        setLoading(false);
      });
  }, []);

  const getRankStyles = (index) => {
    switch (index) {
      case 0: // Gold
        return {
          container: 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50',
          badge: 'bg-yellow-500 text-slate-900',
          text: 'text-yellow-400',
          hoverText: 'hover:text-yellow-400'
        };
      case 1: // Silver
        return {
          container: 'bg-slate-300/10 border-slate-300/30 hover:border-slate-300/50',
          badge: 'bg-slate-300 text-slate-900',
          text: 'text-slate-300',
          hoverText: 'hover:text-slate-300'
        };
      case 2: // Bronze
        return {
          container: 'bg-orange-600/10 border-orange-600/30 hover:border-orange-600/50',
          badge: 'bg-orange-600 text-white',
          text: 'text-orange-400',
          hoverText: 'hover:text-orange-400'
        };
      default:
        return {
          container: 'bg-slate-800/40 border-slate-700/30 hover:border-slate-600/50',
          badge: 'bg-slate-700 text-slate-300',
          text: 'text-green-400',
          hoverText: 'hover:text-blue-400'
        };
    }
  };

  return (
    <PremiumCard
      title="MVPs Última Jornada"
      icon={Trophy}
      color="yellow"
      loading={loading}
    >
      {!loading && (
        <div className="flex-1 flex flex-col justify-between gap-2 relative z-10">
          {mvps && mvps.length > 0 ? (
            mvps.map((player, index) => {
              const styles = getRankStyles(index);
              return (
                <div 
                  key={player.player_id} 
                  className={`p-3 rounded-lg border transition-all ${styles.container}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold shrink-0 ${styles.badge}`}>
                      {index <= 2 ? <Award className="w-5 h-5" /> : index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <Link href={`/player/${player.player_id}`} className={`font-medium text-white text-sm transition-colors block ${styles.hoverText}`}>
                        {player.name}
                      </Link>
                      <div className="text-xs text-slate-400">{getShortTeamName(player.team)} · {player.position}</div>
                      {player.owner_name && (
                        <div className="text-xs text-blue-400">👤 {player.owner_name}</div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className={`font-bold text-sm ${styles.text}`}>
                        {player.points} pts
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500">No hay datos de la última jornada</div>
          )}
        </div>
      )}
    </PremiumCard>
  );
}