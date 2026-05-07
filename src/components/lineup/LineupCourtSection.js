'use client';

import { FadeIn } from '@/components/ui';
import LineupCourt from './LineupCourt';

export default function LineupCourtSection({ starters, captainName, onPlayerClick }) {
  return (
    <div className="lg:col-span-3">
      <FadeIn delay={100}>
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="h-6 w-1.5 bg-primary rounded-full" />
          <h3 className="text-xl font-bold uppercase tracking-widest text-white">
            Quinteto Inicial
          </h3>
        </div>

        {/* Court */}
        <LineupCourt
          players={starters}
          onPlayerClick={onPlayerClick}
          className="h-[650px]"
          playerSize="large"
        />
      </FadeIn>
    </div>
  );
}
