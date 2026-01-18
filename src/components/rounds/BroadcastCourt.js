'use client';

import { motion } from 'framer-motion';
import StandupPlayerCard from './StandupPlayerCard';

export default function BroadcastCourt({ players = [], onPlayerClick }) {
  // comprehensive Formation Lookup
  const getFormation = (starters) => {
    const counts = { Base: 0, Alero: 0, Pivot: 0 };
    starters.forEach((p) => (counts[p.position] = (counts[p.position] || 0) + 1));

    // Create signature: "Base-Alero-Pivot"
    const signature = `${counts.Base}-${counts.Alero}-${counts.Pivot}`;

    // Helper: Slot builder
    const build = (ids) => ids.map((def) => ({ ...def }));

    // Coordinate Definitions (Percentages)
    const POS = {
      // Guards (Tier 1 & 2)
      PG_MID: { top: '75%', left: '50%', label: 'G' },
      G_LEFT: { top: '75%', left: '30%', label: 'G' },
      G_RIGHT: { top: '75%', left: '70%', label: 'G' },
      G_LEFT_HIGH: { top: '65%', left: '20%', label: 'G' },
      G_RIGHT_HIGH: { top: '65%', left: '80%', label: 'G' },

      // Forwards / Wings (Tier 2 & 3)
      F_MID: { top: '45%', left: '50%', label: 'F' }, // High Post
      F_LEFT: { top: '50%', left: '25%', label: 'F' }, // Brought closer (was 20%)
      F_RIGHT: { top: '50%', left: '75%', label: 'F' }, // Brought closer (was 80%)
      F_ELBOW_L: { top: '42%', left: '35%', label: 'F' },
      F_ELBOW_R: { top: '42%', left: '65%', label: 'F' },

      // Centers / Bigs (Tier 3 & 4)
      C_LOW: { top: '20%', left: '50%', label: 'C' },
      C_LOW_L: { top: '25%', left: '35%', label: 'C' },
      C_LOW_R: { top: '25%', left: '65%', label: 'C' },
      C_HIGH: { top: '35%', left: '50%', label: 'C' },
    };

    const FORMATIONS = {
      // --- STANDARD LINEUPS ---
      '2-2-1': [POS.G_LEFT, POS.G_RIGHT, POS.F_LEFT, POS.F_RIGHT, POS.C_LOW],
      '1-2-2': [POS.PG_MID, POS.F_LEFT, POS.F_RIGHT, POS.C_LOW_L, POS.C_LOW_R], // 1 Guard, 2 Wings, 2 Bigs
      '2-1-2': [POS.G_LEFT, POS.G_RIGHT, POS.F_MID, POS.C_LOW_L, POS.C_LOW_R],
      '1-3-1': [POS.PG_MID, POS.F_LEFT, POS.F_MID, POS.F_RIGHT, POS.C_LOW],

      // --- SMALL BALL (3+ Bases) ---
      '3-1-1': [POS.PG_MID, POS.G_LEFT_HIGH, POS.G_RIGHT_HIGH, POS.F_MID, POS.C_LOW], // U-Shape + Stack
      '3-2-0': [POS.PG_MID, POS.G_LEFT_HIGH, POS.G_RIGHT_HIGH, POS.F_ELBOW_L, POS.F_ELBOW_R], // U-Shape + Split
      '3-0-2': [POS.PG_MID, POS.G_LEFT_HIGH, POS.G_RIGHT_HIGH, POS.C_LOW_L, POS.C_LOW_R], // U-Shape + Split Bigs
      '2-3-0': [POS.G_LEFT, POS.G_RIGHT, POS.F_LEFT, POS.F_MID, POS.F_RIGHT], // 2 Guards + Flat Line

      // --- TALL BALL (3+ Pivots/Aleros) ---
      '1-1-3': [POS.PG_MID, POS.F_MID, POS.C_LOW_L, POS.C_HIGH, POS.C_LOW_R], // 1-1-3 Zone
      '0-2-3': [POS.F_LEFT, POS.F_RIGHT, POS.C_LOW_L, POS.C_HIGH, POS.C_LOW_R], // No Guards!
      '2-0-3': [POS.G_LEFT, POS.G_RIGHT, POS.C_LOW_L, POS.C_HIGH, POS.C_LOW_R],
      '0-3-2': [POS.F_LEFT, POS.F_MID, POS.F_RIGHT, POS.C_LOW_L, POS.C_LOW_R], // 3 Wings, 2 Bigs
      '3-0-2': [POS.PG_MID, POS.G_LEFT_HIGH, POS.G_RIGHT_HIGH, POS.C_LOW_L, POS.C_LOW_R], // (Duplicate key check, effectively same structure)
    };

    // Fallback?
    // User signature might not match exactly if counts > 5 or weird data?
    // We assume standard 5 players.
    // If not found, determine nearest fallback or default.
    let coords = FORMATIONS[signature];

    if (!coords) {
      // Automatic Fallback Logic based on majority
      // Reuse the specific 'special' configs if exact signature misses
      if (counts.Base >= 3) coords = FORMATIONS['3-1-1'];
      else if (counts.Pivot >= 3) coords = FORMATIONS['1-1-3'];
      else if (counts.Alero >= 3) coords = FORMATIONS['1-3-1'];
      else coords = FORMATIONS['2-2-1']; // Most standard fallback
    }

    // Now assign IDs (ordered by position group usually)
    // The problem: The 'coords' array has 5 slots. The 'starters' array has 5 players sorted Base->Alero->Pivot.
    // We need to map them intelligently?
    // Actually, FORMATIONS keys map to the SORTED identifiers effectively:
    // e.g. '2-2-1' -> 2 Bases (take G_LEFT, G_RIGHT), 2 Aleros (take F_LEFT, F_RIGHT), 1 Pivot (take C_LOW)
    // The `starters` list is sorted Base -> Alero -> Pivot.
    // So 'coords' MUST be defined in that order: Base Slots -> Alero Slots -> Pivot Slots.

    // Let's RE-ORDER the definitions in FORMATIONS to strictly match Base -> Alero -> Pivot sequence.

    // RE-DEFINING PROPER ORDER:
    const F_ORDERED = {
      '2-2-1': [POS.G_LEFT, POS.G_RIGHT, POS.F_LEFT, POS.F_RIGHT, POS.C_LOW],
      '1-2-2': [POS.PG_MID, POS.F_LEFT, POS.F_RIGHT, POS.C_LOW_L, POS.C_LOW_R],
      '2-1-2': [POS.G_LEFT, POS.G_RIGHT, POS.F_MID, POS.C_LOW_L, POS.C_LOW_R],
      '1-3-1': [POS.PG_MID, POS.F_LEFT, POS.F_MID, POS.F_RIGHT, POS.C_LOW],

      '3-1-1': [POS.G_LEFT_HIGH, POS.PG_MID, POS.G_RIGHT_HIGH, POS.F_MID, POS.C_LOW], // 3 Bases, 1 Alero, 1 Pivot
      '3-2-0': [POS.G_LEFT_HIGH, POS.PG_MID, POS.G_RIGHT_HIGH, POS.F_ELBOW_L, POS.F_ELBOW_R], // 3 Bases, 2 Aleros
      '3-0-2': [POS.G_LEFT_HIGH, POS.PG_MID, POS.G_RIGHT_HIGH, POS.C_LOW_L, POS.C_LOW_R], // 3 Bases, 2 Pivots

      '2-3-0': [POS.G_LEFT, POS.G_RIGHT, POS.F_LEFT, POS.F_MID, POS.F_RIGHT],

      '1-1-3': [POS.PG_MID, POS.F_MID, POS.C_LOW_L, POS.C_HIGH, POS.C_LOW_R],
      '0-2-3': [POS.F_LEFT, POS.F_RIGHT, POS.C_LOW_L, POS.C_HIGH, POS.C_LOW_R],
      '2-0-3': [POS.G_LEFT, POS.G_RIGHT, POS.C_LOW_L, POS.C_HIGH, POS.C_LOW_R],
      '0-3-2': [POS.F_LEFT, POS.F_MID, POS.F_RIGHT, POS.C_LOW_L, POS.C_LOW_R],
    };

    const finalCoords = F_ORDERED[signature] || F_ORDERED['2-2-1']; // Default

    // Merge coords with specific IDs if we want framer keys to be stable?
    // Or just return the coords for the map
    return finalCoords.map((c, i) => ({ ...c, id: `p-${i}` })); // Simple stable IDs valid for this round
  };

  const starters = players.slice(0, 5);
  const formation = getFormation(starters);

  return (
    <div className="w-full max-w-4xl mx-auto overflow-hidden">
      {/* 3D STAGE CONTAINER */}
      {/* perspective-1000 creates the 3D depth */}
      <div className="relative h-[650px] w-full bg-slate-900 perspective-[1200px] overflow-hidden rounded-xl shadow-2xl">
        {/* THE COURT PLANE */}
        {/* rotate-x-60 tilts it backward */}
        <div
          className="absolute inset-0 w-full h-[225%] origin-top transform-3d rotate-x-[60deg] scale-110 -translate-y-10 bg-orange-100"
          style={{
            backgroundImage: `
              linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px),
              linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
              url('https://www.transparenttextures.com/patterns/wood-pattern.png')
            `,
            backgroundSize: '40px 40px, 40px 40px, auto',
          }}
        >
          {/* --- COURT MARKINGS (Distorted by the CSS tilt naturally) --- */}

          {/* Paint Area (Orange/Wood contrast) */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[40%] h-[35%] bg-orange-200/50 border-x-4 border-b-4 border-white/40"></div>

          {/* Free Throw Circle */}
          <div className="absolute top-[35%] left-1/2 -translate-x-1/2 w-[40%] h-[20%] -translate-y-1/2 rounded-full border-4 border-white/40"></div>

          {/* 3-Point Arc */}
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[90%] h-[80%] rounded-b-full border-4 border-white/40 border-t-0"></div>

          {/* Center Logo (EuroLeague style) */}
          <div className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[30%] h-[20%] opacity-30">
            {/* Replace with actual logo img if needed */}
            <div className="w-full h-full border-4 border-white rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-4xl rotate-180">LEAGUE</span>
            </div>
          </div>
        </div>

        {/* PLAYERS CONTAINER (Z-Index Layering) */}
        {/* Note: We do NOT rotate this container. We place items absolutely. */}
        <div className="absolute inset-0 pointer-events-none">
          {starters.map((player, index) => {
            const pos = formation[index] || { top: '50%', left: '50%' };

            return (
              <motion.div
                key={player.player_id}
                className="absolute pointer-events-auto"
                style={{ top: pos.top, left: pos.left }}
                initial={{ opacity: 0, y: -100 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, type: 'spring' }}
              >
                {/* CRITICAL: The Counter-Rotation 
                  The court is rotated X +60deg. 
                  We rotate the player X -60deg (or similar) so they stand up straight relative to the camera.
                  We usually need slightly less than -60 to look natural, e.g., -10 to -30 depending on perspective.
                  Actually, since we didn't rotate the PARENT container of the players, 
                  we just need to position them on screen.
                  
                  BUT, to match the visual "feet on floor" look, it's often better to put the players IN the rotated div,
                  then counter rotate. 
                  
                  HOWEVER, the easiest way (The "Fake 3D" way) used by most apps:
                  Just overlay them flat on top of the tilted background!
                  
                  Let's stick to the "Overlay" method as it's cleaner for DOM clicks, 
                  but we'll add a subtle tilt to the card itself if you want that "billboard" vibe.
                */}

                {/* Centering the card on the coordinate */}
                <div className="-translate-x-1/2 -translate-y-1/2">
                  <StandupPlayerCard player={player} onClick={onPlayerClick} />
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
