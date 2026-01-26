// Court Dimensions (Feet)
export const COURT_WIDTH = 50;
export const COURT_HEIGHT = 47;

// --- DYNAMIC FORMATION LOGIC ---
export const getFormation = (starters) => {
  // 1. Create buckets to group players while tracking their original index
  // We track index so we can return the array in the exact same order React expects it.
  const groups = {
    Pivot: [], // TOP LEVEL (Near Basket)
    Alero: [], // MIDDLE LEVEL (Wings/Elbows)
    Base: [], // BOTTOM LEVEL (Perimeter/Halfcourt)
  };

  starters.forEach((player, index) => {
    // Safety check: if position is missing, default to Base
    const pos = player.position || 'Base';
    if (groups[pos]) {
      groups[pos].push({ index, ...player });
    } else {
      groups.Base.push({ index, ...player });
    }
  });

  // 2. Define "Y" Levels (Distance from Baseline Y=0)
  const LEVEL_Y = {
    Pivot: 8, // Deep in paint / Low block (Moved up)
    Alero: 21, // Free throw line extended (Moved up to space out)
    Base: 34, // Top of key / Logo area
  };

  // 3. Define "X" Spacing Logic (Horizontal Distribution)
  // Based on how many players are in that row, where should they sit?
  const getXPositions = (count, role) => {
    // PIVOTS: Keep them tight (Paint area)
    if (role === 'Pivot') {
      if (count === 1) return [25]; // Center
      if (count === 2) return [17, 33]; // Low Blocks
      if (count === 3) return [15, 25, 35]; // Wall
      return [15, 22, 28, 35]; // Crowd (Compressed from 12-38)
    }

    // ALEROS: Spread them out (Wings/Corners)
    if (role === 'Alero') {
      if (count === 1) return [25]; // High Post
      if (count === 2) return [10, 40]; // Wings (Compressed from 8-42)
      if (count === 3) return [8, 25, 42]; // Corner - High - Corner (Compressed from 5-45)
      return [8, 19, 31, 42]; // 4-out look (Compressed from 5-45)
    }

    // BASES: Standard Guard Slots
    if (role === 'Base') {
      if (count === 1) return [25]; // Point Guard
      if (count === 2) return [16, 34]; // Guard Slots
      if (count === 3) return [14, 25, 36]; // 3-guard front (Compressed from 12-38)
      return [12, 21, 29, 38]; // Press break (Compressed from 10-40)
    }

    return [25]; // Fallback
  };

  // 4. Calculate Final Coordinates
  const finalPositions = new Array(starters.length);

  // Process PIVOTS
  const pivotXs = getXPositions(groups.Pivot.length, 'Pivot');
  groups.Pivot.forEach((p, i) => {
    finalPositions[p.index] = { x: pivotXs[i], y: LEVEL_Y.Pivot, id: `p-${p.index}` };
  });

  // Process ALEROS
  const aleroXs = getXPositions(groups.Alero.length, 'Alero');
  groups.Alero.forEach((p, i) => {
    finalPositions[p.index] = { x: aleroXs[i], y: LEVEL_Y.Alero, id: `p-${p.index}` };
  });

  // Process BASES
  const baseXs = getXPositions(groups.Base.length, 'Base');
  groups.Base.forEach((p, i) => {
    finalPositions[p.index] = { x: baseXs[i], y: LEVEL_Y.Base, id: `p-${p.index}` };
  });

  return finalPositions;
};

// Helper for CSS
export const toPct = (val, max) => `${(val / max) * 100}%`;
