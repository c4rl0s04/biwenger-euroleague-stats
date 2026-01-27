'use client';

import { motion } from 'framer-motion';
import PlayerCourtCard from './PlayerCourtCard';
import { getFormation, toPct, COURT_WIDTH, COURT_HEIGHT } from '@/lib/constants/courtPositions';

// --- COMPONENT: GEOMETRIC LAYER (The Floor Markings) ---
const GeometricLayer = () => {
  // COLORS - Minimalistic Palette
  const LINE_COLOR = 'rgba(255, 255, 255, 0.3)'; // Subtle white lines
  const PAINT_COLOR = '#ea580c'; // Orange tint
  const PAINT_OPACITY = '0.15'; // Subtle glow

  // Dimensions for calculations
  const CENTER_X = 25;
  const HOOP_Y = 5.25; // Rim center is ~5.25ft from baseline
  const KEY_WIDTH_HALF = 8; // 16ft total
  const THREE_POINT_RADIUS = 23.75;
  const THREE_POINT_SIDE_MARGIN = 3; // Line is 3ft from sideline

  // 3-Point Line Calculation
  // Intersection Y: sqrt(R^2 - X_dist^2) + HOOP_Y
  // X_dist = 22ft (25 center - 3 sideline dist)
  // Y_offset = sqrt(23.75^2 - 22^2) ≈ 8.95
  // Break Point Y ≈ 5.25 + 8.95 = 14.2
  const TP_BREAK_Y = 14.2;

  return (
    <svg
      viewBox={`0 0 ${COURT_WIDTH} ${COURT_HEIGHT}`}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ overflow: 'visible' }}
      preserveAspectRatio="xMidYMid slice"
    >
      {/* 1. The Paint (Key) - Extended to cover top gap */}
      <rect
        x={CENTER_X - KEY_WIDTH_HALF}
        y="-50"
        width={KEY_WIDTH_HALF * 2}
        height="69"
        fill={PAINT_COLOR}
        fillOpacity={PAINT_OPACITY}
        stroke="none"
      />

      {/* 2. Free Throw Circle (Top Half) */}
      <path
        d={`M ${CENTER_X - 6},19 A 6,6 0 0,1 ${CENTER_X + 6},19`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth="0.2"
      />
      {/* Free Throw Circle (Bottom Half - Dashed) */}
      <path
        d={`M ${CENTER_X - 6},19 A 6,6 0 0,0 ${CENTER_X + 6},19`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth="0.2"
        strokeDasharray="0.8,0.8"
      />

      {/* 3. Three Point Line (Extended verticals) */}
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

      {/* 4. Restricted Area (No Charge Zone) - 4ft radius */}
      <path
        d={`M ${CENTER_X - 4},${HOOP_Y} A 4,4 0 0,0 ${CENTER_X + 4},${HOOP_Y}`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth="0.2"
      />
      {/* ... rest of SVG ... */}

      {/* 5. The Hoop & Backboard */}
      {/* Backboard */}
      <line
        x1={CENTER_X - 3}
        y1="4"
        x2={CENTER_X + 3}
        y2="4"
        stroke="rgba(255,255,255,0.8)"
        strokeWidth="0.2"
      />

      {/* Rim */}
      <circle
        cx={CENTER_X}
        cy={HOOP_Y}
        r="0.75"
        stroke={PAINT_COLOR}
        strokeWidth="0.2"
        fill="none"
      />

      {/* 6. Center Court Circle (Half visible at bottom) */}
      <path
        d={`M ${CENTER_X - 6},${COURT_HEIGHT} A 6,6 0 0,1 ${CENTER_X + 6},${COURT_HEIGHT}`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth="0.2"
      />

      {/* 7. Main Key Border (Extended) */}
      <path
        d={`M ${CENTER_X - KEY_WIDTH_HALF},-50 V 19 H ${CENTER_X + KEY_WIDTH_HALF} V -50`}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth="0.2"
      />
    </svg>
  );
};

// --- MAIN COMPONENT ---
export default function BasketballCourt({ players = [], onPlayerClick, className }) {
  const starters = players.slice(0, 5);
  const positions = getFormation(starters);

  return (
    <div
      className={`w-full flex items-center justify-center bg-slate-950/50 rounded-xl overflow-hidden relative ${className || 'h-[650px]'}`}
    >
      {/* Court Container: Fills parent completely (Stretched) */}
      <div className="relative h-full w-full shadow-2xl shadow-black/50 rounded-xl overflow-hidden bg-zinc-950">
        {/* 1. Floor Texture & Gradients - RESTORED MINIMALIST */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Subtle wood grain using mix-blend-overlay for tinting */}
          <div className="absolute inset-0 opacity-10 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]" />
          {/* Soft slate gradients instead of heavy black vignette */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80" />
        </div>

        {/* 2. Court Markings */}
        <GeometricLayer />

        {/* 3. Players Layer */}
        <div className="absolute inset-0 z-10">
          {starters.map((player, index) => {
            const pos = positions[index] || { x: 25, y: 25 };

            return (
              <motion.div
                key={player.player_id || index}
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
                {/* Wrapper div is centered (w-0 h-0). PlayerCard renders centered. */}
                <div className="hover:z-50 transition-all">
                  <PlayerCourtCard player={player} onClick={onPlayerClick} size="large" />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
