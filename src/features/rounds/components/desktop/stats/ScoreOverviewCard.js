import { Trophy, Target, TrendingDown } from 'lucide-react';
import { RoundCard } from '../../RoundCard';

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
    orange: 'text-primary',
    emerald: 'text-[var(--round-ideal)]',
    purple: 'text-[var(--round-global)]',
    zinc: 'text-muted-foreground',
  };

  const textColor = colorClasses[color] || colorClasses.zinc;

  // Coach rating styling
  const rating = coachRating?.efficiency ?? 0;
  let ratingColor = 'text-[var(--round-danger)]';
  if (rating >= 90) ratingColor = 'text-[var(--round-ideal)]';
  else if (rating >= 70) ratingColor = 'text-[var(--round-record)]';
  else if (rating >= 50) ratingColor = 'text-primary';

  return (
    <RoundCard title={title} icon={Trophy} color={color} bgColor={color} className="h-fit">
      <div className="flex items-center gap-4">
        {/* LEFT: Points (1/4) */}
        <div className="flex flex-col items-center justify-center min-w-[90px] border-r border-border pr-4">
          <span
            className={`text-5xl font-bold font-mono tracking-tighter ${textColor} drop-shadow-[0_0_15px_rgba(250,80,1,0.2)]`}
          >
            {total_points == null ? '/' : Math.round(total_points)}
          </span>
          <span className="text-[11px] text-muted-foreground font-black uppercase tracking-[0.2em] mt-1">
            {total_points == null
              ? 'PTS'
              : summary.provisional
                ? 'Provisional'
                : round_rank
                  ? `#${round_rank}`
                  : 'PTS'}
          </span>
        </div>

        {/* RIGHT: Coach Rating (3/4) - Always visible */}
        {coachRating && total_points != null && (
          <div className="flex-1 py-1">
            <div className="flex items-center justify-between mb-3">
              {/* Efficiency */}
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
                  Eficiencia
                </span>
                <div className="flex items-center gap-1.5">
                  <Target size={14} className="text-muted-foreground" />
                  <span className={`text-xl font-bold font-mono ${ratingColor}`}>{rating}%</span>
                </div>
              </div>

              {/* Points Lost */}
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest mb-0.5">
                  Perdidos
                </span>
                <div className="flex items-center gap-1.5">
                  <span className="text-xl font-bold font-mono text-red-500">
                    -{Math.round((coachRating?.maxScore || 0) - (coachRating?.actualScore || 0))}
                  </span>
                  <TrendingDown size={14} className="text-red-500/70" />
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden border border-border">
              <div
                className={`h-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(250,250,250,0.1)] ${
                  rating >= 90 ? 'bg-emerald-500' : rating >= 70 ? 'bg-yellow-500' : 'bg-orange-500'
                }`}
                style={{ width: `${rating}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </RoundCard>
  );
}
