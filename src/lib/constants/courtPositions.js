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
    Pivot: 10, // Deep in paint / Low block
    Alero: 24, // Free throw line extended
    Base: 38, // Top of key / Logo area
  };

  // 3. Define "X" Spacing Logic (Horizontal Distribution)
  // Based on how many players are in that row, where should they sit?
  const getXPositions = (count, role) => {
    // PIVOTS: Keep them tight (Paint area)
    if (role === 'Pivot') {
      if (count === 1) return [25]; // Center
      if (count === 2) return [17, 33]; // Low Blocks
      if (count === 3) return [15, 25, 35]; // Wall
      return [12, 20, 30, 38]; // Crowd
    }

    // ALEROS: Spread them out (Wings/Corners)
    if (role === 'Alero') {
      if (count === 1) return [25]; // High Post
      if (count === 2) return [8, 42]; // Wings
      if (count === 3) return [5, 25, 45]; // Corner - High - Corner
      return [5, 18, 32, 45]; // 4-out look
    }

    // BASES: Standard Guard Slots
    if (role === 'Base') {
      if (count === 1) return [25]; // Point Guard
      if (count === 2) return [16, 34]; // Guard Slots
      if (count === 3) return [12, 25, 38]; // 3-guard front
      return [10, 20, 30, 40]; // Press break
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
