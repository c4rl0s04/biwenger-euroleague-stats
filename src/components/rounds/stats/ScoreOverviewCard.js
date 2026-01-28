import { Trophy, Target, TrendingDown } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function ScoreOverviewCard({ summary, viewMode, user }) {
  if (!summary) return null;

  const { total_points, round_rank } = summary;
  const coachRating = user?.coachRating;

  let title = 'Puntuación';
  let color = 'zinc';

  if (viewMode === 'user') {
    title = 'Tu Puntuación';
    color = 'orange';
  } else if (viewMode === 'user_ideal') {
    title = 'Máximo Potencial';
    color = 'emerald';
  } else if (viewMode === 'ideal') {
    title = 'Puntuación Ideal';
    color = 'purple';
  }

  // Color classes for dynamic styling
  const colorClasses = {
    orange: 'text-orange-400',
    emerald: 'text-emerald-400',
    purple: 'text-purple-400',
    zinc: 'text-zinc-400',
  };

  const textColor = colorClasses[color] || colorClasses.zinc;

  // Coach rating styling
  const rating = coachRating?.rating || 0;
  let ratingColor = 'text-red-400';
  if (rating >= 90) ratingColor = 'text-emerald-400';
  else if (rating >= 70) ratingColor = 'text-yellow-400';
  else if (rating >= 50) ratingColor = 'text-orange-400';

  return (
    <ElegantCard title={title} icon={Trophy} color={color}>
      <div className="flex items-center gap-4">
        {/* LEFT: Points (1/4) */}
        <div className="flex flex-col items-center justify-center min-w-[80px]">
          <span className={`text-4xl font-bold font-mono tracking-tight ${textColor}`}>
            {Math.round(total_points ?? 0)}
          </span>
          <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest">
            {round_rank ? `#${round_rank}` : 'pts'}
          </span>
        </div>

        {/* RIGHT: Coach Rating (3/4) - Always visible */}
        {coachRating && (
          <div className="flex-1 border-l border-white/10 pl-4">
            <div className="flex items-center justify-between mb-2">
              {/* Efficiency */}
              <div className="flex items-center gap-1.5">
                <Target size={12} className="text-zinc-500" />
                <span className={`text-lg font-bold font-mono ${ratingColor}`}>{rating}%</span>
              </div>

              {/* Points Lost */}
              <div className="flex items-center gap-1.5">
                <TrendingDown size={12} className="text-red-400/50" />
                <span className="text-lg font-bold font-mono text-red-400">
                  -{Math.round(coachRating?.diff || 0)}
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${rating >= 90 ? 'bg-emerald-500' : rating >= 70 ? 'bg-yellow-500' : 'bg-orange-500'}`}
                style={{ width: `${rating}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </ElegantCard>
  );
}
