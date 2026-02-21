import { BrainCircuit } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function CoachRatingCard({ user }) {
  if (!user || user.coachRating === undefined) return null;

  const rating = user.coachRating?.efficiency ?? 0;

  // Rating Color
  let ratingColor = 'text-red-500';
  if (rating >= 90) ratingColor = 'text-emerald-400';
  else if (rating >= 70) ratingColor = 'text-yellow-400';
  else if (rating >= 50) ratingColor = 'text-orange-400';

  return (
    <ElegantCard title="Rendimiento Manager" icon={BrainCircuit} className="w-full" color="purple">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-col">
          <span className={`text-3xl font-bold font-mono tracking-tighter ${ratingColor}`}>
            {rating}%
          </span>
          <span className="text-xs text-zinc-500">Eficiencia</span>
        </div>
        <div className="text-right">
          <div className="text-xs text-zinc-400">Puntos Perdidos</div>
          <div className="text-lg font-bold text-red-400">
            -{Math.round((user.coachRating?.maxScore || 0) - (user.coachRating?.actualScore || 0))}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden mb-2">
        <div
          className={`h-full ${rating >= 90 ? 'bg-emerald-500' : 'bg-orange-500'}`}
          style={{ width: `${rating}%` }}
        />
      </div>
    </ElegantCard>
  );
}
