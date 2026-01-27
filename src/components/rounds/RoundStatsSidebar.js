'use client';

import ScoreOverviewCard from './stats/ScoreOverviewCard'; // New import
import CoachRatingCard from './stats/CoachRatingCard';
import RoundMVPCard from './stats/RoundMVPCard';
import GradaCard from './stats/GradaCard';
import OptimizationTips from './stats/OptimizationTips';

export default function RoundStatsSidebar({ stats, loading, summary, viewMode }) {
  if (loading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-32 bg-white/5 rounded-xl" />
        <div className="h-32 bg-white/5 rounded-xl" />
      </div>
    );
  }

  // Allow ScoreOverviewCard to render even if full stats are missing (e.g. initial load)
  // But usually we need stats for everything else.
  const { global, user } = stats || {};

  return (
    <div className="space-y-6">
      <ScoreOverviewCard summary={summary} viewMode={viewMode} />

      {stats && (
        <>
          <CoachRatingCard user={user} />
          <RoundMVPCard global={global} />
          <GradaCard user={user} />
          <OptimizationTips user={user} />
        </>
      )}
    </div>
  );
}
