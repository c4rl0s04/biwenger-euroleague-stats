import Image from 'next/image';
import { Crown } from 'lucide-react';

export default function RoundMVPCard({ global }) {
  if (!global) return null;

  return (
    <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-yellow-500/10 to-amber-900/20 border border-yellow-500/20 p-4">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 text-yellow-500 mb-1">
            <Crown size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">MVP de la Jornada</span>
          </div>
          {global.mvp ? (
            <>
              <div className="text-lg font-bold text-white leading-tight">{global.mvp.name}</div>
              <div className="text-xs text-white/50 mb-3">{global.mvp.team_name}</div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold text-yellow-400">{global.mvp.points}</span>
                <span className="text-xs text-yellow-500/70">pts</span>
              </div>
            </>
          ) : (
            <span className="text-xs text-white/50">No disponible</span>
          )}
        </div>
        {/* Optional: Player Image if available */}
        {global.mvp?.img && (
          <div className="relative w-16 h-16 rounded-full border border-white/10 overflow-hidden">
            <Image src={global.mvp.img} alt="MVP" fill className="object-cover" />
          </div>
        )}
      </div>
    </div>
  );
}
