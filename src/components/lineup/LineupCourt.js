'use client';

import { motion } from 'framer-motion';
import LineupPlayerCard from './LineupPlayerCard';
import { getFormation, toPct, COURT_WIDTH, COURT_HEIGHT } from '@/lib/constants/courtPositions';

const GeometricLayer = () => {
  const LINE_COLOR = 'rgba(255, 255, 255, 0.25)';
  const PAINT_COLOR = 'hsl(var(--primary))';
  const PAINT_OPACITY = '0.12';
  const CENTER_X = 25;
  const HOOP_Y = 5.25;
  const KEY_WIDTH_HALF = 8;
  const THREE_POINT_RADIUS = 23.75;
  const THREE_POINT_SIDE_MARGIN = 3;
  const TP_BREAK_Y = 14.2;

  return (
    <svg
      viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
      preserveAspectRatio="xMidYMid slice"
    >
      <rect
        x={CENTER_X - KEY_WIDTH_HALF}
        y="-50"
        width={KEY_WIDTH_HALF * 2}
        height="69"
        fill={PAINT_COLOR}
        fillOpacity={PAINT_OPACITY}
        stroke="none"
      />
      <path
        d={`M ${CENTER_X - 6},19 A 6,6 0 0,1 ${CENTER_X + 6},19`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth="0.2"
      />
      <path
        d={`M ${CENTER_X - 6},19 A 6,6 0 0,0 ${CENTER_X + 6},19`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth="0.2"
        strokeDasharray="0.8,0.8"
      />
      <path
        d={`
          M ${THREE_POINT_SIDE_MARGIN},-50 
          V ${TP_BREAK_Y} 
          A ${THREE_POINT_RADIUS},${THREE_POINT_RADIUS} 0 0 0 ${50 - THREE_POINT_SIDE_MARGIN},${TP_BREAK_Y} 
          V -50
        `}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth="0.2"
      />
      <path
        d={`M ${CENTER_X - 4},${HOOP_Y} A 4,4 0 0,0 ${CENTER_X + 4},${HOOP_Y}`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth="0.2"
      />
      <line
        x1={CENTER_X - 3}
        y1="4"
        x2={CENTER_X + 3}
        y2="4"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="0.2"
      />
      <circle
        cx={CENTER_X}
        cy={HOOP_Y}
        r="0.75"
        stroke={PAINT_COLOR}
        strokeWidth="0.2"
        fill="none"
      />
      <path
        d={`M ${CENTER_X - 6},${COURT_HEIGHT} A 6,6 0 0,1 ${CENTER_X + 6},${COURT_HEIGHT}`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth="0.2"
      />
      <path
        d={`M ${CENTER_X - KEY_WIDTH_HALF},-50 V 19 H ${CENTER_X + KEY_WIDTH_HALF} V -50`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth="0.2"
      />
    </svg>
  );
};

export default function LineupCourt({
  players = [],
  onPlayerClick,
  className,
  playerSize = 'large',
}) {
  const starters = players.slice(0, 5);
  const positions = getFormation(starters);

  return (
    <div
      className={`w-full flex items-center justify-center bg-slate-950/50 rounded-xl overflow-hidden relative ${className || 'h-[650px]'}`}
    >
      <div className="relative h-full w-full shadow-2xl shadow-black/50 rounded-xl overflow-hidden bg-zinc-950">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80" />
        </div>

        <GeometricLayer />

        <div className="absolute inset-0 z-10">
          {starters.map((player, index) => {
            const pos = positions[index] || { x: 25, y: 25 };

            return (
              <motion.div
                key={player.id || index}
                className="absolute w-0 h-0 flex items-center justify-center"
                style={{
                  left: toPct(pos.x, COURT_WIDTH),
                  top: toPct(pos.y, COURT_HEIGHT),
                }}
                initial={{ opacity: 0, scale: 0, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  delay: index * 0.1,
                }}
              >
                <div className="hover:z-50 transition-all">
                  <LineupPlayerCard player={player} onClick={onPlayerClick} size={playerSize} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
