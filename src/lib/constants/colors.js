export const USER_COLORS = [
  {
    bg: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    stroke: '#60a5fa',
  },
  {
    bg: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    stroke: '#c084fc',
  },
  {
    bg: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    stroke: '#34d399',
  },
  {
    bg: 'from-pink-500/20 to-pink-600/10',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
    stroke: '#f472b6',
  },
  {
    bg: 'from-cyan-500/20 to-cyan-600/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    stroke: '#22d3ee',
  },
  {
    bg: 'from-orange-500/20 to-orange-600/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    stroke: '#fb923c',
  },
  {
    bg: 'from-yellow-500/20 to-yellow-600/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    stroke: '#facc15',
  },
  {
    bg: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    stroke: '#f87171',
  },
];

export const SPECIAL_USER_COLORS = {
  'All Stars': {
    bg: 'from-amber-700/30 to-amber-900/20',
    border: 'border-amber-600/40',
    text: 'text-amber-500',
    stroke: '#f59e0b',
  },
};

export function getColorForUser(userId, userName) {
  if (SPECIAL_USER_COLORS[userName]) {
    return SPECIAL_USER_COLORS[userName];
  }

  // Deterministic hash based on userId (works for both string/number IDs)
  const idStr = String(userId);
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}
