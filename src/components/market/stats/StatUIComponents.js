'use client';

import Link from 'next/link';
import { getColorForUser } from '@/lib/constants/colors';

/**
 * A premium, standardized bubble for manager profiles.
 * Includes color-coding, glow effects, and a zoom interaction on hover.
 */
export function ManagerPill({ user }) {
  if (!user) return null;

  const userId = user.user_id || user.id;
  const userName = user.user_name || user.name;
  const userColor = getColorForUser(userId, userName, user.user_color_index);

  return (
    <Link
      href={`/user/${userId}`}
      className="group/manager block hover:scale-105 transition-transform duration-300 transform-gpu"
    >
      <div
        className={`px-4 py-1.5 rounded-full text-sm font-black ${userColor.bg} ${userColor.text} bg-opacity-20 border border-current border-opacity-10 group-hover/manager:bg-opacity-30 transition-all shadow-lg backdrop-blur-sm`}
      >
        {userName}
      </div>
    </Link>
  );
}

/**
 * A lightweight manager name with zoom effect, used for lists and runner-ups.
 */
export function ManagerName({ user, className = '' }) {
  if (!user) return null;

  const userId = user.user_id || user.id;
  const userName = user.user_name || user.name;
  const userColor = getColorForUser(userId, userName, user.user_color_index);

  return (
    <Link
      href={`/user/${userId}`}
      className={`font-bold transition-all hover:scale-105 inline-block origin-left transform-gpu ${userColor.text} ${className}`}
    >
      {userName}
    </Link>
  );
}

/**
 * A standardized layout for secondary hero stats (e.g., Purchase/Sale price).
 * Ensures correct sizing and legibility across all cards.
 */
export function HeroStatGroup({ stats = [] }) {
  return (
    <div className="flex justify-center gap-16 text-xs mt-8">
      {stats.map((stat, idx) => (
        <div key={idx} className="flex flex-col items-center">
          <span className="text-zinc-500 font-bold uppercase tracking-widest text-sm mb-2">
            {stat.label}
          </span>
          <span className="text-white font-mono font-black text-2xl tracking-tighter">
            {stat.value}
            {stat.suffix || ''}
          </span>
        </div>
      ))}
    </div>
  );
}
