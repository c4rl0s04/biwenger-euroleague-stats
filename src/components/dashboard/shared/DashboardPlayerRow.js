'use client';

import Link from 'next/link';
import { getShortTeamName } from '@/lib/utils/format';
import { User } from 'lucide-react';

export default function DashboardPlayerRow({
  playerId,
  name,
  team,
  owner,
  avatar,       // The circular icon/image component
  rightContent, // The stats (Points, Price, etc.)
}) {
  return (
    // FIXED HEIGHT: h-20 (80px) is tall enough for 3 distinct lines without feeling cramped
    <div className="flex items-center gap-4 h-20 px-3 border-b border-border/50 last:border-0 group/item transition-all hover:bg-secondary/20">
      
      {/* 1. Left: Avatar Container */}
      <div className="w-10 flex justify-center shrink-0">
        {avatar}
      </div>

      {/* 2. Middle: Player Info (Strict 3-Line Grid) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        
        {/* Line 1: Player Name */}
        <Link
          href={`/player/${playerId}`}
          className="font-medium text-foreground text-base truncate hover:text-primary transition-colors block leading-tight mb-0.5"
        >
          {name}
        </Link>
        
        {/* Line 2: Team Name */}
        <div className="text-xs text-muted-foreground truncate leading-tight mb-0.5">
          {getShortTeamName(team)}
        </div>

        {/* Line 3: Owner (Always takes up h-4 space, even if empty) */}
        <div className="h-4 flex items-center">
          {owner ? (
            <span className="flex items-center gap-1 text-xs text-blue-400/90 truncate">
              <User size={10} className="shrink-0" />
              <span className="truncate">{owner}</span>
            </span>
          ) : (
            // Invisible placeholder to force the height to match
            <span className="text-xs opacity-0 select-none" aria-hidden="true">
              -
            </span>
          )}
        </div>

      </div>

      {/* 3. Right: Stats Container */}
      <div className="text-right shrink-0 flex flex-col justify-center min-w-[60px]">
        {rightContent}
      </div>
    </div>
  );
}