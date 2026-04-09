'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { User } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import { motion } from 'framer-motion';

// ─── Layout constants ────────────────────────────────────────────────────────
const CARD_HEIGHT = 72; // px – taller for large text
const MIN_CARD_WIDTH = 260; // px – wider for large text
const MIN_COL_GAP = 40; // px – balanced gap
const MIN_SLOT_H = 100; // px – minimum vertical slot per match

// ─── Tiny helpers ────────────────────────────────────────────────────────────
function PlayerRow({
  userId,
  icon,
  name,
  leg1,
  leg2,
  total,
  leg1Won,
  leg2Won,
  won,
  isFinished,
  userColor,
  isTop,
  isTwoLegged,
}) {
  const color = getColorForUser(userId, name, userColor);

  return (
    <Link
      href={`/user/${userId}`}
      className={[
        'group/player relative flex items-center h-9',
        'transition-colors duration-200',
        won ? 'bg-white/[0.04]' : 'bg-transparent hover:bg-white/[0.02]',
        isTop ? 'border-b border-white/[0.08]' : '',
      ].join(' ')}
    >
      {/* Player Info Section */}
      <div className="flex-1 flex items-center gap-3 min-w-0 px-3 h-full border-r border-white/[0.08]">
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
            'text-[14px] sm:text-[15px] truncate tracking-wide',
            won
              ? `font-bold ${color.text}`
              : isFinished
                ? 'font-medium text-zinc-100' // Brighter than zinc-400
                : `font-medium ${color.text}`,
          ].join(' ')}
        >
          {name ?? 'TBD'}
        </span>
      </div>

      {/* Scores Section */}
      <div className="flex shrink-0 h-full divide-x divide-white/[0.04]">
        {isTwoLegged && (
          <>
            <div
              className={[
                'w-10 flex items-center justify-center',
                leg1Won ? 'bg-amber-500/10' : 'bg-black/10',
              ].join(' ')}
            >
              <span
                className={[
                  'font-mono text-[12px] tabular-nums',
                  leg1Won ? 'text-amber-400 font-bold' : 'text-zinc-200', // Brighter than zinc-400
                ].join(' ')}
              >
                {leg1 ?? '—'}
              </span>
            </div>
            <div
              className={[
                'w-10 flex items-center justify-center',
                leg2Won ? 'bg-amber-500/10' : 'bg-black/20',
              ].join(' ')}
            >
              <span
                className={[
                  'font-mono text-[12px] tabular-nums',
                  leg2Won ? 'text-amber-400 font-bold' : 'text-zinc-200',
                ].join(' ')}
              >
                {leg2 ?? '—'}
              </span>
            </div>
          </>
        )}
        <div
          className={[
            'w-14 flex items-center justify-center',
            won ? 'bg-amber-500/20' : isFinished ? 'bg-black/40' : 'bg-transparent',
          ].join(' ')}
        >
          <span
            className={[
              'font-mono text-[14px] tabular-nums',
              won
                ? 'text-white font-black'
                : isFinished
                  ? 'text-zinc-100 font-medium'
                  : 'text-zinc-400 font-medium',
            ].join(' ')}
          >
            {total ?? '—'}
          </span>
        </div>
      </div>
    </Link>
  );
}

function MatchCard({ match, isFinal }) {
  const isFinished = match.isFinished;
  const isTwoLegged = !!match.isTwoLegged;

  const homeLeg1Won =
    isTwoLegged &&
    match.home_leg1 !== null &&
    match.away_leg1 !== null &&
    match.home_leg1 > match.away_leg1;
  const awayLeg1Won =
    isTwoLegged &&
    match.home_leg1 !== null &&
    match.away_leg1 !== null &&
    match.away_leg1 > match.home_leg1;
  const homeLeg2Won =
    isTwoLegged &&
    match.home_leg2 !== null &&
    match.away_leg2 !== null &&
    match.home_leg2 > match.away_leg2;
  const awayLeg2Won =
    isTwoLegged &&
    match.home_leg2 !== null &&
    match.away_leg2 !== null &&
    match.away_leg2 > match.home_leg2;

  return (
    <div
      className={[
        'relative flex flex-col overflow-hidden',
        'rounded-md border bg-[#111114] w-full shadow-lg',
        isFinal ? 'border-amber-500/30 ring-1 ring-inset ring-amber-500/10' : 'border-white/[0.12]',
      ].join(' ')}
      style={{ height: CARD_HEIGHT }}
    >
      <PlayerRow
        userId={match.home_user_id}
        icon={match.home_user_icon}
        name={match.home_user_name}
        leg1={match.home_leg1}
        leg2={match.home_leg2}
        total={match.home_total}
        leg1Won={homeLeg1Won}
        leg2Won={homeLeg2Won}
        won={match.winner === 'home'}
        isFinished={isFinished}
        userColor={match.home_user_color}
        isTop={true}
        isTwoLegged={isTwoLegged}
      />

      <PlayerRow
        userId={match.away_user_id}
        icon={match.away_user_icon}
        name={match.away_user_name}
        leg1={match.away_leg1}
        leg2={match.away_leg2}
        total={match.away_total}
        leg1Won={awayLeg1Won}
        leg2Won={awayLeg2Won}
        won={match.winner === 'away'}
        isFinished={isFinished}
        userColor={match.away_user_color}
        isTop={false}
        isTwoLegged={isTwoLegged}
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
function getCleanRoundName(phaseType, phaseName, roundIndex, totalRounds) {
  const lower = (phaseType || phaseName || '').toLowerCase();

  const mapping = {
    roundof32: 'Dieciseisavos',
    roundof16: 'Octavos',
    quarterfinal: 'Cuartos',
    semifinal: 'Semifinales',
    dieciseis: 'Dieciseisavos',
    octavos: 'Octavos',
    cuartos: 'Cuartos',
    'semi-final': 'Semifinales',
    'quarter-final': 'Cuartos',
    final: 'Gran Final', // Moved to end so it's the catch-all for final-only strings
  };

  // Direct mapping
  for (const [key, value] of Object.entries(mapping)) {
    if (lower.includes(key)) return value;
  }

  // Fallback for distance calculation
  const dist = totalRounds - 1 - roundIndex;
  if (dist === 0) return 'Gran Final';
  if (dist === 1) return 'Semifinales';
  if (dist === 2) return 'Cuartos';
  if (dist === 3) return 'Octavos';
  if (dist === 4) return 'Dieciseisavos';

  return (phaseName || '').replace(/\(.*\)/, '').trim();
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function TournamentBracket({ tournament, fixtures }) {
  const playoffConfig = tournament?.data?.config?.playoff || {};
  const isTwoLegged = playoffConfig.twoLegged === true || playoffConfig.twolegged === true;
  const isTwoLeggedFinal =
    playoffConfig.twoLeggedFinal === true || playoffConfig.twoleggedfinal === true;

  const rounds = useMemo(() => {
    if (!fixtures?.length) return [];

    // 1. Group items by their logical Phase
    const phaseMap = {};
    fixtures.forEach((f) => {
      // Determine what phase this round belongs to
      let pId = f.phase_id;
      let pType = f.phase_type;
      let pName = f.phase_name;

      // Fallback: Check the tournament config rounds list
      if (!pId || !pType) {
        const rConf = tournament?.data?.rounds?.find((r) => r.round?.name === f.round_name);
        if (rConf) {
          pType = rConf.type;
          // Use type as ID if we don't have a better one
          pId = pId || rConf.type;
        }
      }

      const gId = pId || pType || pName || f.round_name;

      if (!phaseMap[gId]) {
        phaseMap[gId] = {
          id: pId,
          type: pType,
          name: pName || f.round_name,
          fixtures: [],
        };
      }
      phaseMap[gId].fixtures.push(f);
    });

    const phaseArray = Object.values(phaseMap).sort((a, b) => {
      const order = ['roundof32', 'roundof16', 'quarterfinal', 'semifinal', 'final', 'gran final'];
      const ia = order.findIndex((t) => (a.type || a.name || '').toLowerCase().includes(t));
      const ib = order.findIndex((t) => (b.type || b.name || '').toLowerCase().includes(t));
      if (ia !== -1 && ib !== -1) return ia - ib;
      return (a.id || 0) - (b.id || 0);
    });

    // 2. Process Aggregation per Phase
    return phaseArray.map((phase) => {
      const aggregatedMatches = [];
      const matches = phase.fixtures;

      const isFinalPhase =
        (phase.type || phase.name || '').toLowerCase().includes('final') &&
        !(phase.type || phase.name || '').toLowerCase().includes('quarter') &&
        !(phase.type || phase.name || '').toLowerCase().includes('semi');

      const shouldAggregate = isTwoLegged && (!isFinalPhase || isTwoLeggedFinal);

      if (shouldAggregate) {
        const processedIds = new Set();
        matches.forEach((f) => {
          if (processedIds.has(f.id)) return;

          // Find partner leg
          const leg2 = matches.find(
            (m) =>
              !processedIds.has(m.id) &&
              m.id !== f.id &&
              ((String(m.home_user_id) === String(f.away_user_id) &&
                String(m.away_user_id) === String(f.home_user_id)) ||
                (String(m.home_user_id) === String(f.home_user_id) &&
                  String(m.away_user_id) === String(f.away_user_id)))
          );

          if (leg2) {
            const hLeg1 = f.home_score ?? 0;
            const aLeg1 = f.away_score ?? 0;
            const hLeg2 =
              (leg2.home_user_id === f.home_user_id ? leg2.home_score : leg2.away_score) ?? 0;
            const aLeg2 =
              (leg2.away_user_id === f.away_user_id ? leg2.away_score : leg2.home_score) ?? 0;
            const hTotal = hLeg1 + hLeg2;
            const aTotal = aLeg1 + aLeg2;
            const isFinished = f.status === 'finished' && leg2.status === 'finished';

            aggregatedMatches.push({
              id: `agg-${f.id}`,
              isTwoLegged: true,
              isFinished,
              winner: isFinished
                ? hTotal > aTotal
                  ? 'home'
                  : aTotal > hTotal
                    ? 'away'
                    : null
                : null,
              home_user_id: f.home_user_id,
              home_user_name: f.home_user_name,
              home_user_icon: f.home_user_icon,
              home_user_color: f.home_user_color,
              away_user_id: f.away_user_id,
              away_user_name: f.away_user_name,
              away_user_icon: f.away_user_icon,
              away_user_color: f.away_user_color,
              home_leg1: f.home_score,
              away_leg1: f.away_score,
              home_leg2: leg2.home_user_id === f.home_user_id ? leg2.home_score : leg2.away_score,
              away_leg2: leg2.away_user_id === f.away_user_id ? leg2.away_score : leg2.home_score,
              home_total: hTotal,
              away_total: aTotal,
            });
            processedIds.add(f.id);
            processedIds.add(leg2.id);
          } else {
            // No partner found (maybe a bye or data mismatch), treat as single leg
            aggregatedMatches.push({
              ...f,
              isTwoLegged: false,
              isFinished: f.status === 'finished',
              home_total: f.home_score,
              away_total: f.away_score,
              winner:
                f.status === 'finished' ? (f.home_score > f.away_score ? 'home' : 'away') : null,
            });
            processedIds.add(f.id);
          }
        });
      } else {
        // Single leg behavior
        matches.forEach((f) => {
          aggregatedMatches.push({
            ...f,
            isTwoLegged: false,
            isFinished: f.status === 'finished',
            home_total: f.home_score,
            away_total: f.away_score,
            winner:
              f.status === 'finished' ? (f.home_score > f.away_score ? 'home' : 'away') : null,
          });
        });
      }

      return {
        ...phase,
        matches: aggregatedMatches.sort(
          (a, b) =>
            (a.order_index || 0) - (b.order_index || 0) ||
            a.id.toString().localeCompare(b.id.toString())
        ),
      };
    });
  }, [fixtures, isTwoLegged, isTwoLeggedFinal, tournament]);

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
          const cleanName = getCleanRoundName(round.type, round.name, ri, layout.length);

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
