'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { User, Trophy } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';

// ─── Layout constants ────────────────────────────────────────────────────────
const CARD_HEIGHT = 76; // px – height of a match card
const CARD_WIDTH = 192; // px – width of each column / card
const COL_GAP = 52; // px – horizontal gap between columns (connector zone)
const MIN_SLOT_H = 104; // px – minimum vertical slot per match

// ─── Tiny helpers ────────────────────────────────────────────────────────────
function PlayerRow({ userId, icon, name, score, won, isFinished, userColor }) {
  const color = getColorForUser(userId, name, userColor);

  return (
    <Link
      href={`/user/${userId}`}
      className={[
        'group/player flex items-center justify-between px-2.5 py-1.5',
        'transition-colors duration-150',
        won ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]',
      ].join(' ')}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-2 min-w-0">
        <div
          className={[
            'w-5 h-5 rounded-full overflow-hidden shrink-0',
            'border transition-colors duration-150',
            won ? 'border-white/20' : 'border-white/8',
            'bg-zinc-800',
          ].join(' ')}
        >
          {icon ? (
            <img
              src={icon.startsWith('http') ? icon : `https://cdn.biwenger.com/${icon}`}
              alt={name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-500">
              <User size={10} />
            </div>
          )}
        </div>

        <span
          className={[
            'text-[11px] truncate transition-colors duration-150',
            won
              ? `font-semibold text-white ${color.text}`
              : `font-medium text-zinc-500 ${color.text}`,
          ].join(' ')}
        >
          {name ?? 'TBD'}
        </span>
      </div>

      {/* Score */}
      <span
        className={[
          'font-mono text-xs tabular-nums ml-2 shrink-0 font-bold',
          won ? 'text-emerald-400' : isFinished ? 'text-zinc-500' : 'text-zinc-600',
        ].join(' ')}
      >
        {score ?? '—'}
      </span>
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
        'rounded-lg border transition-all duration-200',
        isFinal
          ? 'border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.08)]'
          : 'border-white/[0.08] hover:border-white/[0.14]',
        'bg-[#111114] shadow-md',
      ].join(' ')}
      style={{ height: CARD_HEIGHT, width: CARD_WIDTH }}
    >
      {isFinal && (
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/60 to-transparent" />
      )}

      <PlayerRow
        userId={match.home_user_id}
        icon={match.home_user_icon}
        name={match.home_user_name}
        score={match.home_score}
        won={homeWon}
        isFinished={isFinished}
        userColor={match.home_user_color}
      />

      {/* Divider */}
      <div className="h-px mx-2.5 bg-white/[0.05]" />

      <PlayerRow
        userId={match.away_user_id}
        icon={match.away_user_icon}
        name={match.away_user_name}
        score={match.away_score}
        won={awayWon}
        isFinished={isFinished}
        userColor={match.away_user_color}
      />

      {/* Status tag */}
      {!isFinished && (
        <div className="absolute bottom-1 right-2">
          <span className="text-[8px] font-mono uppercase tracking-widest text-zinc-600">
            Pendiente
          </span>
        </div>
      )}
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
    const xMid = COL_GAP / 2;

    const path = srcB
      ? `M 0 ${yA} H ${xMid} V ${yB} M ${xMid} ${yMid} H ${COL_GAP} M 0 ${yB} H ${xMid}`
      : `M 0 ${yA} H ${COL_GAP}`;

    lines.push(
      <path
        key={j}
        d={path}
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    );
  });

  return (
    <svg width={COL_GAP} height={totalHeight} className="shrink-0" style={{ display: 'block' }}>
      {lines}
    </svg>
  );
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

  return (
    <div className="overflow-x-auto pb-6 -mx-4 px-4 sm:mx-0 sm:px-0 scrollbar-hide">
      {/* Round headers */}
      <div className="flex min-w-max mb-4">
        {layout.map((round, ri) => (
          <div key={round.name} className="flex items-center shrink-0">
            <div className="flex flex-col items-center gap-0.5" style={{ width: CARD_WIDTH }}>
              <span
                className={[
                  'text-[11px] font-semibold tracking-wide truncate px-2',
                  ri === finalRoundIndex ? 'text-amber-400/90' : 'text-white/60',
                ].join(' ')}
              >
                {round.name}
              </span>
              <span className="text-[9px] text-zinc-600 uppercase tracking-[0.15em] font-bold">
                {round.matches.length === 1 ? '1 Partido' : `${round.matches.length} Partidos`}
              </span>
            </div>
            {ri < layout.length - 1 && <div style={{ width: COL_GAP }} />}
          </div>
        ))}
      </div>

      {/* Bracket body */}
      <div className="relative flex min-w-max" style={{ height: totalHeight }}>
        {layout.map((round, ri) => {
          const isFinalRound = ri === finalRoundIndex;

          return (
            <div key={round.name} className="flex items-stretch shrink-0">
              {/* Column of match cards */}
              <div className="relative shrink-0" style={{ width: CARD_WIDTH, height: totalHeight }}>
                {round.matches.map((match) => (
                  <div key={match.id} className="absolute" style={{ top: match.cardTop, left: 0 }}>
                    <MatchCard match={match} isFinal={isFinalRound} />
                  </div>
                ))}
              </div>

              {/* Connectors to the right */}
              {ri < layout.length - 1 && (
                <RoundConnector
                  leftRound={round}
                  rightRound={layout[ri + 1]}
                  totalHeight={totalHeight}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
