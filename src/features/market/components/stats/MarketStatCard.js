'use client';

import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { getColorForUser } from '@/lib/constants/colors';
import { formatEuro } from '@/lib/utils/currency';

/**
 * MarketStatCard - Harmonized with Cleaner List Structure & Bigger Fonts
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
  renderMiddle,
  info,
  className = '',
}) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!data || !Array.isArray(data) || data.length === 0) return null;

  const winner = data[0];
  const runnerUps = data.slice(1);
  const route = type === 'player' ? '/player/' : '/user/';

  const winnerColor =
    type === 'user'
      ? getColorForUser(winner[fields.id], winner[fields.name], winner[fields.colorIndex])
      : { text: 'text-white' };

  const formatValue = renderValue || ((val) => `${formatEuro(val)} €`);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`group/stat transition-all duration-300 h-fit ${className}`}
    >
      <ElegantCard
        title={title}
        icon={icon}
        color={color}
        info={info}
        className="h-auto rounded-2xl border-white/5 group-hover/stat:border-primary/30 transition-colors duration-500 shadow-xl"
      >
        {/* Subtle Brand Glow */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/0 via-transparent to-primary/0 opacity-0 group-hover/stat:opacity-5 transition-opacity duration-700 pointer-events-none rounded-[inherit]" />

        <div className="flex flex-col relative z-20">
          {/* 1. Winner Section */}
          <div className="mt-1 text-center py-5 flex flex-col items-center">
            {winnerLabel && (
              <div
                className="text-2xl font-display uppercase tracking-tighter mb-1 opacity-100 text-center w-full leading-[0.8]"
                style={{ color: `var(--color-${color}-400)` }}
              >
                {winnerLabel}
              </div>
            )}

            <Link href={`${route}${winner[fields.id] || ''}`} className="block group/link">
              <div
                className={`text-2xl md:text-3xl font-black transition-all duration-500 tracking-tight leading-tight mb-1 font-sans
                ${type === 'user' ? winnerColor.text : 'text-white group-hover/link:text-primary'}`}
              >
                {winner[fields.name] || 'Desconocido'}
              </div>
            </Link>

            <motion.div
              layoutId={`value-${title}`}
              className="text-2xl md:text-3xl font-bold text-white mt-1 font-mono tracking-tight tabular-nums"
            >
              {formatValue(winner[fields.value])}
            </motion.div>

            {renderWinnerMeta && (
              <div className="mt-2.5 opacity-75 scale-95 origin-center font-sans tracking-tight">
                {renderWinnerMeta(winner, winnerColor)}
              </div>
            )}
          </div>

          {/* 2. Expansion Toggle */}
          {runnerUps.length > 0 && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-1 flex items-center justify-center gap-2 text-xs uppercase font-bold tracking-[0.15em] text-zinc-300 hover:text-white transition-all py-3 border-t border-white/5 cursor-pointer group/button"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5 group-hover/button:-translate-y-0.5 transition-transform" />
                  Ocultar Ranking
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5 group-hover/button:translate-y-0.5 transition-transform" />
                  Ver Ranking Completo
                </>
              )}
            </button>
          )}

          {/* 3. Runner-ups List - Clean Separator Lines */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="overflow-hidden"
              >
                <motion.div
                  className="px-2 pb-3"
                  initial="hidden"
                  animate="show"
                  variants={{
                    show: { transition: { staggerChildren: 0.04 } },
                  }}
                >
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
                      <motion.div
                        key={`${item[fields.id]}-${index}`}
                        variants={{
                          hidden: { opacity: 0, y: 4 },
                          show: { opacity: 1, y: 0 },
                        }}
                        className="flex items-center justify-between py-2.5 px-2 text-sm border-b border-white/5 last:border-0 hover:bg-white/[0.02] transition-colors group/item"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <span className="text-xs text-zinc-600 font-bold w-4 flex-shrink-0 font-mono">
                            {(index + 2).toString().padStart(2, '0')}
                          </span>
                          <Link
                            href={`${route}${item[fields.id]}`}
                            className={`truncate font-medium transition-colors ${itemColor.text} ${type === 'player' ? 'group-hover/item:text-white' : 'group-hover/item:brightness-125'}`}
                          >
                            {item[fields.name]}
                          </Link>
                        </div>

                        {renderMiddle && (
                          <div className="px-2 flex-shrink-0">{renderMiddle(item, index)}</div>
                        )}

                        <div className="whitespace-nowrap ml-auto tabular-nums font-mono font-medium">
                          {renderListItemValue ? (
                            renderListItemValue(item, index)
                          ) : (
                            <span className="text-zinc-500 group-hover/item:text-zinc-200 transition-colors">
                              {formatValue(item[fields.value])}
                            </span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </ElegantCard>
    </motion.div>
  );
}
