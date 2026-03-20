'use client';

import Link from 'next/link';
import Image from 'next/image';
import { getColorForUser } from '@/lib/constants/colors';

/**
 * StatsList - Reusable component for advanced stats cards
 * Features:
 * - Box-less design with separators
 * - Adaptive vertical height
 * - Clickable manager icons & names
 * - Consistent typography scale
 */
export default function StatsList({ items, renderRight, indexOffset = 0 }) {
  return (
    <div className="divide-y divide-slate-800/50 -mx-1 flex-1 flex flex-col">
      {items.map((item, index) => {
        const userColor = getColorForUser(item.user_id, item.name, item.color_index);
        return (
          <div
            key={item.user_id}
            className="group flex flex-1 items-center justify-between py-1.5 px-2 hover:bg-white/5 transition-colors w-full"
          >
            {/* User Info Section */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <span className="text-slate-500 font-mono text-xs w-5 flex-shrink-0">
                {index + 1 + indexOffset}
              </span>

              {/* Clickable Icon */}
              <Link
                href={`/user/${item.user_id}`}
                className="relative w-8 h-8 shrink-0 transition-transform hover:scale-110 active:scale-95 z-10"
              >
                {item.icon ? (
                  <Image
                    src={item.icon}
                    alt={item.name}
                    fill
                    className="rounded-full object-cover ring-2 ring-white/10"
                    sizes="32px"
                  />
                ) : (
                  <div
                    className="w-full h-full rounded-full flex items-center justify-center text-[10px] font-bold text-white ring-2 ring-white/10"
                    style={{ backgroundColor: userColor.stroke }}
                  >
                    {item.name.charAt(0)}
                  </div>
                )}
              </Link>

              {/* Clickable Name */}
              <div className="min-w-0">
                <Link
                  href={`/user/${item.user_id}`}
                  className={`font-bold text-sm ${userColor.text} truncate block transition-transform group-hover:translate-x-1 origin-left`}
                >
                  {item.name}
                </Link>
                {item.subtitle && (
                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    {item.subtitle}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column (Metrics/Status) */}
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">{renderRight(item)}</div>
          </div>
        );
      })}
    </div>
  );
}
