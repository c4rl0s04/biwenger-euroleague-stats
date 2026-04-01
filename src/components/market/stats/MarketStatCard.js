'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';
import { formatEuro } from '@/lib/utils/currency';

/**
 * MarketStatCard - Reusable template for market statistics
 *
 * @param {Array} data - Array of objects (winner + runner-ups)
 * @param {string} title - Card title
 * @param {React.ElementType} icon - Lucide icon
 * @param {string} color - Accent color
 * @param {string} winnerLabel - Uppercase label above the winner
 * @param {string} type - 'player' | 'user' (determines link routing)
 * @param {Object} fields - Mapping for data fields
 * @param {string} fields.id - User/Player ID field
 * @param {string} fields.name - User/Player Name field
 * @param {string} fields.value - The primary metric field
 * @param {string} fields.colorIndex - Color index field (for users)
 * @param {Function} renderWinnerMeta - Custom render for winner subtitle
 * @param {Function} renderValue - Custom formatter for values
 * @param {string} info - Tooltip info text
 */
export default function MarketStatCard({
  data,
  title,
  icon,
  color = 'primary',
  winnerLabel,
  type = 'player',
  fields = { id: 'id', name: 'name', value: 'value', colorIndex: 'color_index' },
  renderWinnerMeta,
  renderValue,
  renderListItemValue,
  info,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const winner = data[0];
  const runnerUps = data.slice(1);
  const route = type === 'player' ? '/player/' : '/user/';

  // Resolve colors
  const winnerColor =
    type === 'user'
      ? getColorForUser(winner[fields.id], winner[fields.name], winner[fields.colorIndex])
      : { text: 'text-white' };

  const defaultFormat = (val) => `${formatEuro(val)} €`;
  const formatValue = renderValue || defaultFormat;

  return (
    <div className={`hover:scale-[1.02] transition-transform duration-200 h-full ${className}`}>
      <ElegantCard title={title} icon={icon} color={color} info={info}>
        <div className="flex flex-col h-full">
          {/* 1. Winner Section */}
          <div className="mt-2 text-center">
            {winnerLabel && (
              <div
                className={`text-xs uppercase tracking-widest font-black mb-1`}
                style={{ color: `var(--color-${color}-500)` }}
              >
                {winnerLabel}
              </div>
            )}

            <Link href={`${route}${winner[fields.id] || ''}`} className="block group">
              <div
                className={`text-xl md:text-2xl font-black transition-colors truncate px-2 leading-tight ${type === 'user' ? winnerColor.text : `group-hover:text-${color}-400`}`}
              >
                {winner[fields.name] || 'Desconocido'}
              </div>
            </Link>

            <div className="text-xl md:text-2xl font-black text-white mt-1">
              {formatValue(winner[fields.value])}
            </div>

            {renderWinnerMeta && (
              <div className="mt-1">{renderWinnerMeta(winner, winnerColor)}</div>
            )}
          </div>

          {/* 2. Expansion Toggle */}
          {runnerUps.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 flex items-center justify-center gap-1 text-[10px] text-zinc-500 hover:opacity-80 transition-opacity py-1 border-t border-zinc-800 cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3 h-3" />
                  Ocultar top 10
                </>
              ) : (
                <>
                  <ChevronDown className="w-3 h-3" />
                  Ver top 10
                </>
              )}
            </button>
          )}

          {/* 3. Runner-ups List */}
          <div
            className={`overflow-hidden transition-all duration-300 ease-in-out ${
              isExpanded ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
            }`}
          >
            {runnerUps.length > 0 && (
              <div className="pt-2">
                <div className="space-y-1">
                  {runnerUps.map((item, index) => {
                    const itemColor =
                      type === 'user'
                        ? getColorForUser(
                            item[fields.id],
                            item[fields.name],
                            item[fields.colorIndex]
                          )
                        : { text: 'text-zinc-300' };

                    return (
                      <div
                        key={item[fields.id] || index}
                        className="flex items-center justify-between px-2 py-1 text-xs hover:bg-zinc-800/50 rounded"
                      >
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <span className="text-zinc-500 font-bold w-4 flex-shrink-0">
                            {index + 2}.
                          </span>
                          <Link
                            href={`${route}${item[fields.id]}`}
                            className={`truncate transition-colors ${itemColor.text} ${type === 'player' ? `hover:text-${color}-400` : 'hover:brightness-110'}`}
                          >
                            {item[fields.name]}
                          </Link>
                        </div>
                        <div className="whitespace-nowrap ml-2">
                          {renderListItemValue ? (
                            renderListItemValue(item, index)
                          ) : (
                            <span className="text-zinc-400 font-semibold">
                              {formatValue(item[fields.value])}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
