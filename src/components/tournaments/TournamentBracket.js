'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import { motion } from 'framer-motion';

// ─── Layout constants ────────────────────────────────────────────────────────
const CARD_HEIGHT = 56; // px – height of a match card (two 28px rows)
const MIN_CARD_WIDTH = 160; // px – minimum width of each column / card
const MIN_COL_GAP = 24; // px – minimum horizontal gap between columns
const MIN_SLOT_H = 76; // px – minimum vertical slot per match

// ─── Tiny helpers ────────────────────────────────────────────────────────────
function PlayerRow({ userId, icon, name, score, won, isFinished, userColor, isTop }) {
  const color = getColorForUser(userId, name, userColor);

  return (
    <Link
      href={`/user/${userId}`}
      className={[
        'group/player relative flex items-center h-7',
        'transition-colors duration-200',
        won ? 'bg-white/[0.04]' : 'bg-transparent hover:bg-white/[0.02]',
        isTop ? 'border-b border-white/[0.08]' : '',
      ].join(' ')}
    >
      {/* Player Info Section */}
      <div className="flex-1 flex items-center gap-2 min-w-0 px-2 h-full border-r border-white/[0.08]">
        <div
          className={[
            'w-4 h-4 rounded-sm overflow-hidden shrink-0 bg-zinc-900 border',
            won ? 'border-white/20' : 'border-white/5 group-hover/player:border-white/10',
          ].join(' ')}
        >
          {icon ? (
            <img
              src={icon.startsWith('http') ? icon : `https://cdn.biwenger.com/${icon}`}
              alt={name}
              className="w-full h-full object-cover grayscale-[0.2]"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500 bg-white/5">
              <User size={10} />
            </div>
          )}
        </div>

        <span
          className={[
            'text-[11px] truncate tracking-wide',
            won
              ? `font-bold ${color.text}`
              : isFinished
                ? 'font-medium text-zinc-400'
                : `font-medium ${color.text}`,
          ].join(' ')}
        >
          {name ?? 'TBD'}
        </span>
      </div>

      {/* Score Box Section */}
      <div
        className={[
          'w-9 h-full flex items-center justify-center shrink-0',
          won ? 'bg-white/5' : isFinished ? 'bg-black/20' : 'bg-transparent',
        ].join(' ')}
      >
        <span
          className={[
            'font-mono text-[11px] tabular-nums',
            won
              ? 'text-white font-bold'
              : isFinished
                ? 'text-zinc-500 font-medium'
                : 'text-zinc-600 font-medium',
          ].join(' ')}
        >
          {score ?? '—'}
        </span>
      </div>
    </Link>
  );
}

function MatchCard({ match, isFinal }) {
  const isFinished =
    match.status === 'finished' || (match.home_score !== null && match.away_score !== null);

  const homeWon = isFinished && match.home_score > match.away_score;
  const awayWon = isFinished && match.away_score > match.home_score;

  return (
    <div
      className={[
        'relative flex flex-col overflow-hidden',
        'rounded-md border bg-[#111114] w-full',
        isFinal ? 'border-amber-500/30 ring-1 ring-inset ring-amber-500/10' : 'border-white/[0.12]',
      ].join(' ')}
      style={{ height: CARD_HEIGHT }}
    >
      <PlayerRow
        userId={match.home_user_id}
        icon={match.home_user_icon}
        name={match.home_user_name}
        score={match.home_score}
        won={homeWon}
        isFinished={isFinished}
        userColor={match.home_user_color}
        isTop={true}
      />

      <PlayerRow
        userId={match.away_user_id}
        icon={match.away_user_icon}
        name={match.away_user_name}
        score={match.away_score}
        won={awayWon}
        isFinished={isFinished}
        userColor={match.away_user_color}
        isTop={false}
      />
    </div>
  );
}

// ─── SVG connector between two adjacent rounds ───────────────────────────────
function RoundConnector({ leftRound, rightRound, totalHeight }) {
  const lines = [];

  rightRound.matches.forEach((target, j) => {
    const srcA = leftRound.matches[j * 2];
    const srcB = leftRound.matches[j * 2 + 1];
    if (!srcA) return;

    const yA = srcA.slotTop + srcA.slotHeight / 2;
    const yB = srcB ? srcB.slotTop + srcB.slotHeight / 2 : yA;
    const yMid = target.slotTop + target.slotHeight / 2;
    const xMid = 50; // Middle of the relative width (0 to 100)

    const path = srcB
      ? `M 0 ${yA} H ${xMid} V ${yB} M ${xMid} ${yMid} H 100 M 0 ${yB} H ${xMid}`
      : `M 0 ${yA} H 100`;

    lines.push(
      <path
        key={j}
        d={path}
        stroke="rgba(255, 255, 255, 0.15)"
        strokeWidth="1.5"
        fill="none"
        strokeLinejoin="miter"
      />
    );
  });

  return (
    <svg
      width="100%"
      height={totalHeight}
      viewBox={`0 0 100 ${totalHeight}`}
      preserveAspectRatio="none"
      className="shrink-0"
      style={{ display: 'block' }}
    >
      {lines}
    </svg>
  );
}

// ─── Phase Mapping ───────────────────────────────────────────────────────────
function getCleanRoundName(name, roundIndex, totalRounds) {
  const lower = name.toLowerCase();

  if (
    lower.includes('final') &&
    !lower.includes('octavos') &&
    !lower.includes('cuartos') &&
    !lower.includes('semi')
  )
    return 'Gran Final';
  if (lower.includes('semi')) return 'Semifinales';
  if (lower.includes('cuartos')) return 'Cuartos';
  if (lower.includes('octavos')) return 'Octavos';
  if (lower.includes('dieciseis')) return 'Dieciseisavos';

  // Fallback for "Round X" or "Jornada X"
  const dist = totalRounds - 1 - roundIndex;
  if (dist === 0) return 'Gran Final';
  if (dist === 1) return 'Semifinales';
  if (dist === 2) return 'Cuartos';
  if (dist === 3) return 'Octavos';
  if (dist === 4) return 'Dieciseisavos';

  return name.replace(/\(.*\)/, '').trim();
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TournamentBracket({ fixtures }) {
  const rounds = useMemo(() => {
    if (!fixtures?.length) return [];

    // Group by round name
    const map = {};
    fixtures.forEach((f) => {
      if (!map[f.round_name]) map[f.round_name] = [];
      map[f.round_name].push(f);
    });

    const order = ['Dieciseisavos', 'Octavos', 'Cuartos', 'Semifinales', 'Final', 'Gran Final'];

    return Object.entries(map)
      .sort(([a], [b]) => {
        const ia = order.findIndex((r) => a.includes(r));
        const ib = order.findIndex((r) => b.includes(r));
        if (ia !== -1 && ib !== -1) return ia - ib;
        if (ia !== -1) return -1;
        if (ib !== -1) return 1;
        return a.localeCompare(b);
      })
      .map(([name, matches]) => ({
        name,
        matches: [...matches].sort((a, b) => a.id - b.id),
      }));
  }, [fixtures]);

  // Compute layout: slot heights + top positions
  const { layout, totalHeight } = useMemo(() => {
    if (!rounds.length) return { layout: [], totalHeight: 400 };

    const firstCount = rounds[0].matches.length;
    const baseSlot = Math.max(MIN_SLOT_H, CARD_HEIGHT + 28);
    const h = firstCount * baseSlot;

    const layout = rounds.map((round) => {
      const count = round.matches.length;
      const slotHeight = h / count;
      return {
        ...round,
        matches: round.matches.map((match, i) => ({
          ...match,
          slotHeight,
          slotTop: i * slotHeight,
          cardTop: i * slotHeight + (slotHeight - CARD_HEIGHT) / 2,
        })),
      };
    });

    return { layout, totalHeight: h };
  }, [rounds]);

  if (!fixtures?.length) {
    return (
      <div className="flex items-center justify-center py-16 rounded-xl border border-dashed border-white/10 bg-white/[0.02]">
        <p className="text-sm text-zinc-500">No hay partidos disponibles para el cuadro.</p>
      </div>
    );
  }

  const finalRoundIndex = layout.length - 1;
  const minWidth = layout.length * MIN_CARD_WIDTH + (layout.length - 1) * MIN_COL_GAP;

  return (
    <div className="overflow-x-auto pb-6 scrollbar-hide w-full">
      <div className="flex w-full min-h-[400px]" style={{ minWidth }}>
        {layout.map((round, ri) => {
          const isFinalRound = ri === finalRoundIndex;
          const cleanName = getCleanRoundName(round.name, ri, layout.length);

          return (
            <motion.div
              key={round.name}
              className="flex items-stretch flex-1 min-w-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: ri * 0.1 }}
            >
              {/* Column Structure: Title + Matches */}
              <div className="flex flex-col flex-1 min-w-0">
                {/* Header Aligned to Column */}
                <div className="h-8 mb-4 flex items-end justify-center text-center">
                  <span
                    className={[
                      'text-[10px] font-bold tracking-[0.2em] uppercase',
                      ri === finalRoundIndex ? 'text-amber-500' : 'text-zinc-500',
                    ].join(' ')}
                  >
                    {cleanName}
                  </span>
                </div>

                {/* Vertical Matches Container */}
                <div className="relative flex-1" style={{ height: totalHeight }}>
                  {round.matches.map((match) => (
                    <div
                      key={match.id}
                      className="absolute w-full"
                      style={{ top: match.cardTop, left: 0 }}
                    >
                      <MatchCard match={match} isFinal={isFinalRound} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Connectors to the right */}
              {ri < layout.length - 1 && (
                <div className="flex-[0.5] min-w-0 flex flex-col">
                  {/* Spacer to match Header height */}
                  <div className="h-8 mb-4" />

                  <div className="relative flex-1">
                    <RoundConnector
                      leftRound={round}
                      rightRound={layout[ri + 1]}
                      totalHeight={totalHeight}
                    />
                  </div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
