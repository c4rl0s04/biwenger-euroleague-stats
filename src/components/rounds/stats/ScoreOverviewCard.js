import { Trophy, TrendingUp } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function ScoreOverviewCard({ summary, viewMode }) {
  if (!summary) return null;

  const { total_points, round_rank } = summary;

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

  return (
    <ElegantCard title={title} icon={Trophy} color={color}>
      <div className="flex items-center justify-between">
        {/* Points - Big & Bold */}
        <div className="flex flex-col">
          <span className="text-sm text-zinc-400 font-medium uppercase tracking-wider">
            Total Puntos
          </span>
          <span className={`text-5xl font-bold font-display text-${color}-400 mt-1`}>
            {Math.round(total_points ?? 0)}
          </span>
        </div>

        {/* Rank - Only if applicable (User Actual View) */}
        {round_rank && (
          <div className="flex flex-col items-end">
            <div className="flex items-center gap-1 text-zinc-400 mb-1">
              <TrendingUp size={14} />
              <span className="text-xs font-medium uppercase tracking-wider">Posición</span>
            </div>
            <div className="text-3xl font-bold text-white">#{round_rank}</div>
          </div>
        )}
      </div>
    </ElegantCard>
  );
}
