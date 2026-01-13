import { CONFIG } from '@/lib/config';

export const USER_COLORS = [
  {
    bg: 'from-blue-500/20 to-blue-600/10',
    border: 'border-blue-500/30',
    text: 'text-blue-400',
    hover: 'hover:text-blue-400',
    groupHover: 'group-hover:text-blue-400',
    stroke: '#60a5fa',
  },
  {
    bg: 'from-yellow-500/20 to-yellow-600/10',
    border: 'border-yellow-500/30',
    text: 'text-yellow-400',
    hover: 'hover:text-yellow-400',
    groupHover: 'group-hover:text-yellow-400',
    stroke: '#facc15',
  },
  {
    bg: 'from-emerald-500/20 to-emerald-600/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-400',
    hover: 'hover:text-emerald-400',
    groupHover: 'group-hover:text-emerald-400',
    stroke: '#34d399',
  },
  {
    bg: 'from-pink-500/20 to-pink-600/10',
    border: 'border-pink-500/30',
    text: 'text-pink-400',
    hover: 'hover:text-pink-400',
    groupHover: 'group-hover:text-pink-400',
    stroke: '#f472b6',
  },
  {
    bg: 'from-cyan-500/20 to-cyan-600/10',
    border: 'border-cyan-500/30',
    text: 'text-cyan-400',
    hover: 'hover:text-cyan-400',
    groupHover: 'group-hover:text-cyan-400',
    stroke: '#22d3ee',
  },
  {
    bg: 'from-orange-500/20 to-orange-600/10',
    border: 'border-orange-500/30',
    text: 'text-orange-400',
    hover: 'hover:text-orange-400',
    groupHover: 'group-hover:text-orange-400',
    stroke: '#fb923c',
  },
  {
    bg: 'from-purple-500/20 to-purple-600/10',
    border: 'border-purple-500/30',
    text: 'text-purple-400',
    hover: 'hover:text-purple-400',
    groupHover: 'group-hover:text-purple-400',
    stroke: '#c084fc',
  },
  {
    bg: 'from-red-500/20 to-red-600/10',
    border: 'border-red-500/30',
    text: 'text-red-400',
    hover: 'hover:text-red-400',
    groupHover: 'group-hover:text-red-400',
    stroke: '#f87171',
  },
  {
    bg: 'from-amber-500/20 to-amber-600/10',
    border: 'border-amber-500/30',
    text: 'text-amber-400',
    hover: 'hover:text-amber-400',
    groupHover: 'group-hover:text-amber-400',
    stroke: '#fbbf24',
  },
  {
    bg: 'from-indigo-500/20 to-indigo-600/10',
    border: 'border-indigo-500/30',
    text: 'text-indigo-400',
    hover: 'hover:text-indigo-400',
    groupHover: 'group-hover:text-indigo-400',
    stroke: '#818cf8',
  },
  {
    bg: 'from-teal-500/20 to-teal-600/10',
    border: 'border-teal-500/30',
    text: 'text-teal-400',
    hover: 'hover:text-teal-400',
    groupHover: 'group-hover:text-teal-400',
    stroke: '#2dd4bf',
  },
  {
    bg: 'from-lime-500/20 to-lime-600/10',
    border: 'border-lime-500/30',
    text: 'text-lime-400',
    hover: 'hover:text-lime-400',
    groupHover: 'group-hover:text-lime-400',
    stroke: '#a3e635',
  },
  {
    bg: 'from-fuchsia-500/20 to-fuchsia-600/10',
    border: 'border-fuchsia-500/30',
    text: 'text-fuchsia-400',
    hover: 'hover:text-fuchsia-400',
    groupHover: 'group-hover:text-fuchsia-400',
    stroke: '#e879f9',
  },
];

export function getColorForUser(userId, userName, colorIndex) {
  // 1. Use Database Index if available (Preferred)
  if (colorIndex !== undefined && colorIndex !== null) {
    return USER_COLORS[colorIndex % USER_COLORS.length];
  }

  // 2. Fallback: Simple modulo of User ID
  // This ensures a deterministic color even if DB index isn't passed (e.g. in legacy components)
  // We strip non-digits just in case, though IDs are usually numeric.
  const idNum = parseInt(String(userId).replace(/\D/g, ''), 10) || 0;
  return USER_COLORS[idNum % USER_COLORS.length];
}
