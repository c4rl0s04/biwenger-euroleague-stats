'use client';

import { FadeIn } from '@/components/ui';
import LineupBench from './LineupBench';

export default function LineupBenchSection({ benchPlayers, onPlayerClick }) {
  return (
    <div className="h-full">
      <FadeIn delay={200}>
        {/* Section Header */}
        <div className="flex items-center gap-3 mb-6 px-2">
          <div className="h-6 w-1.5 bg-zinc-700 rounded-full" />
          <h3 className="text-xl font-bold uppercase tracking-widest text-white">Banquillo</h3>
        </div>

        <LineupBench players={benchPlayers} onPlayerClick={onPlayerClick} className="h-[650px]" />
      </FadeIn>
    </div>
  );
}
