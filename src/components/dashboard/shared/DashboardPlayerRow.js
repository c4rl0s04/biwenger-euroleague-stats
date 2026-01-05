'use client';

import Link from 'next/link';
import { getShortTeamName } from '@/lib/utils/format';
import { User } from 'lucide-react';

export default function DashboardPlayerRow({
  playerId,
  name,
  team,
  teamId, // New prop
  owner,
  ownerId, // New prop
  avatar,
  rightContent,
  color = 'primary', // Default to primary (orange)
}) {
  const hoverMap = {
    yellow: 'hover:text-yellow-400',
    cyan: 'hover:text-cyan-400',
    orange: 'hover:text-orange-400',
    blue: 'hover:text-blue-400',
    green: 'hover:text-green-400',
    purple: 'hover:text-purple-400',
    primary: 'hover:text-primary',
  };

  const hoverClass = hoverMap[color] || 'hover:text-primary';

  return (
    // FIXED HEIGHT: h-20 (80px) is tall enough for 3 distinct lines without feeling cramped
    <div className="flex items-center gap-4 h-20 px-3 border-b border-border/50 last:border-0 group/item transition-all hover:bg-secondary/20">
      {/* 1. Left: Avatar Container */}
      <div className="w-10 flex justify-center shrink-0">{avatar}</div>

      {/* 2. Middle: Player Info (Strict 3-Line Grid) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        {/* Line 1: Player Name */}
        <Link
          href={`/player/${playerId}`}
          className={`font-medium text-foreground text-base truncate ${hoverClass} transition-colors block leading-tight mb-0.5`}
        >
          {name}
        </Link>

        {/* Line 2: Team Name */}
        {teamId ? (
          <Link
            href={`/team/${teamId}`}
            className={`text-xs text-muted-foreground truncate leading-tight mb-0.5 ${hoverClass} transition-colors block`}
          >
            {getShortTeamName(team)}
          </Link>
        ) : (
          <div className="text-xs text-muted-foreground truncate leading-tight mb-0.5">
            {getShortTeamName(team)}
          </div>
        )}

        {/* Line 3: Owner (Always takes up h-4 space, even if empty) */}
        <div className="h-4 flex items-center">
          {owner ? (
            ownerId ? (
              <Link
                href={`/user/${ownerId}`}
                className={`flex items-center gap-1 text-xs text-blue-400/90 truncate ${hoverClass} transition-colors`}
              >
                <User size={10} className="shrink-0" />
                <span className="truncate">{owner}</span>
              </Link>
            ) : (
              <span className="flex items-center gap-1 text-xs text-blue-400/90 truncate">
                <User size={10} className="shrink-0" />
                <span className="truncate">{owner}</span>
              </span>
            )
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
