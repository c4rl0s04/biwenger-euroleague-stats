export const USER_COLORS = [
  {
    bg: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    hover: 'hover:text-blue-400',
    stroke: '#60a5fa',
  },
  {
    bg: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    hover: 'hover:text-purple-400',
    stroke: '#c084fc',
  },
  {
    bg: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    hover: 'hover:text-emerald-400',
    stroke: '#34d399',
  },
  {
    bg: 'from-pink-500/20 to-pink-600/10',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
    hover: 'hover:text-pink-400',
    stroke: '#f472b6',
  },
  {
    bg: 'from-cyan-500/20 to-cyan-600/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    hover: 'hover:text-cyan-400',
    stroke: '#22d3ee',
  },
  {
    bg: 'from-orange-500/20 to-orange-600/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    hover: 'hover:text-orange-400',
    stroke: '#fb923c',
  },
  {
    bg: 'from-yellow-500/20 to-yellow-600/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    hover: 'hover:text-yellow-400',
    stroke: '#facc15',
  },
  {
    bg: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    hover: 'hover:text-red-400',
    stroke: '#f87171',
  },
  {
    bg: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    hover: 'hover:text-amber-400',
    stroke: '#fbbf24',
  },
  {
    bg: 'from-indigo-500/20 to-indigo-600/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    hover: 'hover:text-indigo-400',
    stroke: '#818cf8',
  },
  {
    bg: 'from-teal-500/20 to-teal-600/10',
    border: 'border-teal-500/30',
    text: 'text-teal-400',
    hover: 'hover:text-teal-400',
    stroke: '#2dd4bf',
  },
  {
    bg: 'from-lime-500/20 to-lime-600/10',
    border: 'border-lime-500/30',
    text: 'text-lime-400',
    hover: 'hover:text-lime-400',
    stroke: '#a3e635',
  },
  {
    bg: 'from-fuchsia-500/20 to-fuchsia-600/10',
    border: 'border-fuchsia-500/30',
    text: 'text-fuchsia-400',
    hover: 'hover:text-fuchsia-400',
    stroke: '#e879f9',
  },
];

export function getColorForUser(userId, userName) {
  // Deterministic hash based on userId (works for both string/number IDs)
  const idStr = String(userId);
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = idStr.charCodeAt(i) + ((hash << 5) - hash);
  }

  const index = Math.abs(hash) % USER_COLORS.length;
  return USER_COLORS[index];
}
