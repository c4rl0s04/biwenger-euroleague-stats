'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import PlayerImage from '@/components/ui/PlayerImage';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getTeamColor } from '@/lib/constants/teamColors';
import { getColorForUser } from '@/lib/constants/colors';

/**
 * MarketPodiumCard - A premium template for market statistics featuring:
 * 1. A Hero section for the #1 player
 * 2. A Mini Podium section for #2 and #3 players
 * 3. An expandable list for players #4 to #10
 */
export default function MarketPodiumCard({
  data,
  title,
  icon,
  color = 'primary',
  info,
  winnerLabel,
  // High-level renderers
  renderHeroValue,
  renderHeroStats,
  renderHeroMeta,
  renderRunnerUpValue,
  renderRunnerUpMeta,
  renderListItemValue,
  renderListItemMeta,
  // If provided, we'll try to use team colors for player names
  useTeamColors = false,
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const winner = data[0];
  const runnerUps = data.slice(1, 3);
  const restRunnerUps = data.slice(3);

  // Helper to get name styling and link path
  const getNameConfig = (item) => {
    const isPlayer = !!item.player_id;
    const linkPath = isPlayer ? `/player/${item.player_id}` : `/user/${item.id || item.user_id}`;

    if (useTeamColors && item.player_team) {
      return {
        linkPath,
        className: getTeamColor(item.player_team).text || 'text-white',
      };
    }

    return {
      linkPath,
      style: { color: `var(--color-${color}-400)` },
      className: '',
    };
  };

  return (
    <div className="hover:scale-[1.01] transition-transform duration-300">
      <ElegantCard
        title={title}
        icon={icon}
        color={color}
        info={info}
        className="h-auto border-white/5 shadow-2xl"
      >
        <div className="flex flex-col">
          {/* 1. Hero Section (#1) */}
          <div className="relative mt-2 flex flex-col items-center">
            {/* Player Image */}
            <div className="relative mb-4 group/img">
              <div
                className="absolute inset-0 rounded-full blur-2xl opacity-20 transition-opacity duration-500 group-hover/img:opacity-40"
                style={{ backgroundColor: `var(--color-${color}-500)` }}
              />
              <div
                className={`w-24 h-24 rounded-full overflow-hidden ring-4 ring-offset-4 ring-offset-zinc-950 shadow-2xl relative z-10`}
                style={{ ringColor: `var(--color-${color}-500)` }}
              >
                <Link
                  href={getNameConfig(winner).linkPath}
                  className="block w-full h-full relative z-10"
                >
                  <PlayerImage
                    src={winner.player_img}
                    alt={winner.player_name || winner.user_name || winner.name}
                    width={96}
                    height={96}
                    className="object-cover object-top w-full h-full transform group-hover/img:scale-110 transition-transform duration-700"
                    fallbackSize={48}
                  />
                </Link>
              </div>
            </div>

            {/* Player Name */}
            <div className="text-center group/name">
              <Link href={getNameConfig(winner).linkPath} className="block">
                <span
                  className={`text-2xl font-black transition-all duration-300 block leading-tight hover:scale-105 transition-transform origin-center ${getNameConfig(winner).className}`}
                  style={getNameConfig(winner).style}
                >
                  {winner.player_name || winner.user_name || winner.name}
                </span>
              </Link>
            </div>

            {/* Primary Value */}
            <div className="mt-4 text-center">
              <div className="flex flex-col items-center">
                {renderHeroValue ? (
                  renderHeroValue(winner)
                ) : (
                  <span
                    className={`text-3xl font-black`}
                    style={{ color: `var(--color-${color}-400)` }}
                  >
                    {winner.value?.toLocaleString('es-ES')}
                  </span>
                )}

                {renderHeroStats && <div className="mt-2">{renderHeroStats(winner)}</div>}
              </div>
            </div>

            {/* Meta (e.g. Owner) */}
            {renderHeroMeta && (
              <div className="mt-4 w-full flex justify-center">{renderHeroMeta(winner)}</div>
            )}
          </div>

          {/* 2. Mini Podium (#2, #3) */}
          {runnerUps.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/5 space-y-3">
              {runnerUps.map((item, index) => {
                const rank = index + 2;
                const isSilver = rank === 2;

                return (
                  <div
                    key={(item.player_id || item.id) + '-' + rank}
                    className="flex items-center gap-4 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-all duration-300 group/item"
                  >
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-12 h-12 rounded-full overflow-hidden ring-2 ${isSilver ? 'ring-zinc-400/50' : 'ring-amber-700/50'} shadow-lg`}
                      >
                        <Link
                          href={`/player/${item.player_id || item.id}`}
                          className="block w-full h-full"
                        >
                          <PlayerImage
                            src={item.player_img || item.img}
                            alt={item.player_name || item.name}
                            width={48}
                            height={48}
                            className="object-cover object-top w-full h-full group-hover/item:scale-110 transition-transform duration-500"
                            fallbackSize={24}
                          />
                        </Link>
                      </div>
                      <div
                        className={`absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-black shadow-lg
                        ${isSilver ? 'bg-zinc-400 text-zinc-950' : 'bg-amber-700 text-amber-50'}`}
                      >
                        {rank}
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={getNameConfig(item).linkPath}
                        className={`text-sm font-bold truncate transition-colors block hover:scale-105 transition-transform origin-left ${getNameConfig(item).className}`}
                        style={getNameConfig(item).style}
                      >
                        {item.player_name || item.user_name || item.name}
                      </Link>

                      {renderRunnerUpMeta && (
                        <div className="mt-0.5">{renderRunnerUpMeta(item)}</div>
                      )}
                    </div>

                    <div className="text-right flex flex-col items-end">
                      {renderRunnerUpValue ? (
                        renderRunnerUpValue(item)
                      ) : (
                        <span className="text-sm font-bold text-white">
                          {item.value?.toLocaleString('es-ES')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* 3. Expansion Toggle */}
          {restRunnerUps.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-4 flex items-center justify-center gap-2 text-xs uppercase font-black tracking-[0.2em] text-zinc-500 hover:text-white transition-all py-4 border-t border-white/5 cursor-pointer group/toggle"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-4 h-4 group-hover/toggle:-translate-y-1 transition-transform" />{' '}
                  Ocultar Ranking
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 group-hover/toggle:translate-y-1 transition-transform" />{' '}
                  Ver Ranking Completo
                </>
              )}
            </button>
          )}

          {/* 4. Rest of Ranking (#4-#10) */}
          <div
            className={`overflow-hidden transition-all duration-500 ease-out ${isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
          >
            <div className="pb-4 space-y-1">
              {restRunnerUps.map((item, index) => {
                const rank = index + 4;
                return (
                  <div
                    key={(item.player_id || item.id) + '-' + rank}
                    className="grid grid-cols-[24px_1fr_auto] items-center gap-2 px-3 py-1 rounded-xl hover:bg-white/[0.03] transition-colors group/row"
                  >
                    {/* Rank Column */}
                    <span className="text-sm text-zinc-500 font-black font-display">{rank}</span>

                    {/* Content Column (Player + Manager Stacked) */}
                    <div className="flex flex-col justify-center min-w-0">
                      <Link
                        href={getNameConfig(item).linkPath}
                        className={`text-xs font-bold truncate transition-colors hover:scale-105 transition-transform origin-left ${getNameConfig(item).className}`}
                        style={getNameConfig(item).style}
                      >
                        {item.player_name || item.user_name || item.name}
                      </Link>

                      {renderListItemMeta && (
                        <div className="min-w-0 truncate origin-left">
                          {renderListItemMeta(item)}
                        </div>
                      )}
                    </div>

                    {/* Value Column */}
                    <div className="text-right">
                      {renderListItemValue ? (
                        renderListItemValue(item)
                      ) : (
                        <span className="text-xs font-mono font-bold text-zinc-400 group-hover/row:text-white transition-colors">
                          {item.value?.toLocaleString('es-ES')}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
