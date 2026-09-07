import { AlertTriangle } from 'lucide-react';

export default function OptimizationTips({ user }) {
  // Safe check
  if (!user || !user.captainOpportunityLost || user.captainOpportunityLost <= 0) return null;

  return (
    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex items-start gap-3">
      <AlertTriangle className="text-red-400 shrink-0 mt-0.5" size={16} />
      <div className="text-xs text-red-200">
        <span className="font-bold block mb-1">Error de Capitán</span>
        Debiste elegir a <span className="font-bold text-white">{user.bestPlayerName}</span>.
        Perdiste {user.captainOpportunityLost} puntos extra.
      </div>
    </div>
  );
}
