'use client';

import { motion } from 'framer-motion';
import PlayerCourtCard from './PlayerCourtCard';

// CONSTANTS (Section 3.1)
const COURT_WIDTH_FT = 50;
const COURT_LENGTH_FT = 47; // Half court

// Helper to convert Feet to Percentage for CSS positioning
// We use percentage for the PLAYERS so they stay responsive,
// but we calculate those percentages from real FEET.
const toPct = (feet, max) => `${(feet / max) * 100}%`;

// Section 2.1: Precise SVG Graphics
const GeometricLayer = () => (
  <svg
    viewBox={`0 0 ${COURT_WIDTH_FT} ${COURT_LENGTH_FT}`}
    className="absolute inset-0 w-full h-full text-white/30 pointer-events-none"
    preserveAspectRatio="xMidYMid meet" // Section 3.3
  >
    {/* Floor Texture/Color */}
    <rect width={COURT_WIDTH_FT} height={COURT_LENGTH_FT} fill="transparent" />
    {/* The Paint (Key) - 16ft wide, centered at 25 */}
    {/* M 17 0 L 17 19 L 33 19 L 33 0 */}
    <path
      d="M 17,0 V 19 H 33 V 0"
      fill="white"
      fillOpacity="0.05"
      stroke="currentColor"
      strokeWidth="0.2" // Lines are ~2 inches thick = 0.16 ft
    />
    {/* Free Throw Circle - Center (25, 19), Radius 6ft */}
    <path d="M 19,19 A 6,6 0 0,0 31,19" fill="none" stroke="currentColor" strokeWidth="0.2" />
    <path
      d="M 31,19 A 6,6 0 0,0 19,19"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.2"
      strokeDasharray="1,1"
    />
    {/* Three Point Line - The Complex Arc (Table 2) */}
    {/* Straight lines 3ft from sideline (so x=3 and x=47) for 14ft length */}
    {/* Arc radius 23.75ft centered at Hoop (25, 4.75) */}
    <path
      d="M 3,0 V 14 A 23.75,23.75 0 0 1 47,14 V 0"
      fill="none"
      stroke="currentColor"
      strokeWidth="0.2"
    />
    {/* Restricted Area - 4ft radius from Hoop (25, 4.75) */}
    <path d="M 21,4.75 A 4,4 0 0,1 29,4.75" fill="none" stroke="currentColor" strokeWidth="0.2" />
    {/* Hoop and Backboard */}
    <line x1="22" y1="4" x2="28" y2="4" stroke="white" strokeWidth="0.2" />{' '}
    {/* Backboard 4ft from baseline */}
    <circle cx="25" cy="4.75" r="0.75" stroke="#ea580c" strokeWidth="0.15" fill="none" />{' '}
    {/* Rim */}
    {/* Center Court Circle (at y=47) */}
    <path d="M 19,47 A 6,6 0 0,1 31,47" fill="none" stroke="currentColor" strokeWidth="0.2" />
  </svg>
);

export default function BasketballCourt({ players = [], onPlayerClick }) {
  // Section 3.1: Defining positions in FEET (not percent)
  // Dynamic Formation Logic (Feet Coordinates)
  const getFormation = (starters) => {
    const counts = { Base: 0, Alero: 0, Pivot: 0 };
    starters.forEach((p) => (counts[p.position] = (counts[p.position] || 0) + 1));
    const signature = `${counts.Base}-${counts.Alero}-${counts.Pivot}`;

    // Coordinate Definitions (Feet)
    const POS = {
      PG_MID: { x: 25, y: 38 },
      G_LEFT: { x: 10, y: 38 },
      G_RIGHT: { x: 40, y: 38 },
      G_LEFT_MID: { x: 15, y: 38 },
      G_RIGHT_MID: { x: 35, y: 38 },

      G_LEFT_HIGH: { x: 10, y: 30 },
      G_RIGHT_HIGH: { x: 40, y: 30 },

      F_MID: { x: 25, y: 22 },
      F_LEFT: { x: 10, y: 22 }, // Brought closer (was 5)
      F_RIGHT: { x: 40, y: 22 }, // Brought closer (was 45)
      F_ELBOW_L: { x: 15, y: 20 },
      F_ELBOW_R: { x: 35, y: 20 },

      C_LOW: { x: 25, y: 6 },
      C_LOW_L: { x: 15, y: 8 },
      C_LOW_R: { x: 35, y: 8 },
      C_HIGH: { x: 25, y: 15 },
    };

    // FORMATIONS: Must respect order Base -> Alero -> Pivot
    const F_ORDERED = {
      '2-2-1': [POS.G_LEFT_MID, POS.G_RIGHT_MID, POS.F_LEFT, POS.F_RIGHT, POS.C_LOW],
      '1-2-2': [POS.PG_MID, POS.F_LEFT, POS.F_RIGHT, POS.C_LOW_L, POS.C_LOW_R],
      '2-1-2': [POS.G_LEFT_MID, POS.G_RIGHT_MID, POS.F_MID, POS.C_LOW_L, POS.C_LOW_R],
      '1-3-1': [POS.PG_MID, POS.F_LEFT, POS.F_MID, POS.F_RIGHT, POS.C_LOW],

      '3-1-1': [POS.G_LEFT_HIGH, POS.PG_MID, POS.G_RIGHT_HIGH, POS.F_MID, POS.C_LOW],
      '3-2-0': [POS.G_LEFT_HIGH, POS.PG_MID, POS.G_RIGHT_HIGH, POS.F_ELBOW_L, POS.F_ELBOW_R],
      '3-0-2': [POS.G_LEFT_HIGH, POS.PG_MID, POS.G_RIGHT_HIGH, POS.C_LOW_L, POS.C_LOW_R],

      '2-3-0': [POS.G_LEFT_MID, POS.G_RIGHT_MID, POS.F_LEFT, POS.F_MID, POS.F_RIGHT],

      '1-1-3': [POS.PG_MID, POS.F_MID, POS.C_LOW_L, POS.C_HIGH, POS.C_LOW_R],
      '0-2-3': [POS.F_LEFT, POS.F_RIGHT, POS.C_LOW_L, POS.C_HIGH, POS.C_LOW_R],
      '2-0-3': [POS.G_LEFT_MID, POS.G_RIGHT_MID, POS.C_LOW_L, POS.C_HIGH, POS.C_LOW_R],
      '0-3-2': [POS.F_LEFT, POS.F_MID, POS.F_RIGHT, POS.C_LOW_L, POS.C_LOW_R],
    };

    const finalCoords = F_ORDERED[signature] || F_ORDERED['2-2-1']; // Default

    return finalCoords.map((c, i) => ({ ...c, id: `p-${i}` }));
  };

  const starters = players.slice(0, 5);
  const tacticalPositions = getFormation(starters);

  return (
    // Section 3.3: Container with Fixed Height (Standardized with BroadcastCourt)
    <div className="w-full max-w-4xl mx-auto relative perspective-container h-[650px]">
      <div
        className="relative w-full h-full bg-slate-900 rounded-xl overflow-hidden border-2 border-slate-800 shadow-2xl"
        // Style used to be aspect-ratio based, now fixed height
      >
        {/* Layer 0: Wood Floor Texture */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] opacity-20 mix-blend-overlay pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-slate-900/80 pointer-events-none" />

        {/* Layer 1: Geometric SVG */}
        <GeometricLayer />

        {/* Layer 2: Player Tokens (Interactive Layer) */}
        <div className="absolute inset-0 z-10">
          {starters.map((player, index) => {
            // Fallback to center if extra players exist
            const pos = tacticalPositions[index] || { x: 25, y: 23.5 };

            return (
              <motion.div
                key={player.player_id}
                className="absolute"
                // Crucial: Converting Feet to Percentages for CSS placement
                style={{
                  left: toPct(pos.x, COURT_WIDTH_FT),
                  top: toPct(pos.y, COURT_LENGTH_FT),
                }}
                // Animation Logic (Section 7.3)
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: index * 0.1,
                }}
              >
                {/* Translate -50% to center the token exactly on the coordinate */}
                <div className="-translate-x-1/2 -translate-y-1/2">
                  <PlayerCourtCard player={player} onClick={onPlayerClick} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
