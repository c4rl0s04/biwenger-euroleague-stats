'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import PlayerImage from '@/components/ui/PlayerImage';

export default function BaseRow({ 
  rank, 
  isTop3, 
  imageSrc, 
  name, 
  linkPath, 
  primaryColor, 
  secondaryColor, 
  managerName, 
  managerId, 
  valueLabel, 
  valueText, 
  valueSub,
  isUser,
  idx,
  children // For custom sub-info like trade flows
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 + idx * 0.02 }}
    >
      <Link
        href={linkPath}
        className={`group flex items-center gap-4 p-4 rounded-2xl border transition-all duration-300 ${
          secondaryColor.bg && managerId
            ? `bg-gradient-to-br ${secondaryColor.bg} ${secondaryColor.border} bg-opacity-10 border-opacity-20`
            : 'bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] hover:border-white/10'
        }`}
      >
        {/* Rank */}
        <div
          className={`w-8 font-black italic text-xl tabular-nums text-center ${isTop3 ? 'text-primary' : 'text-zinc-400'}`}
        >
          {rank}
        </div>

        {/* Media */}
        <div className="w-12 h-12 rounded-xl bg-zinc-900 border border-white/5 overflow-hidden shrink-0 relative">
          <PlayerImage
            src={imageSrc}
            name={name}
            width={48}
            height={48}
            className={`w-full h-full object-cover ${!isUser ? 'object-top scale-[1.35] translate-y-1.5' : 'object-center'}`}
          />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col">
            <h4
              className={`font-black uppercase tracking-tight truncate leading-tight transition-colors ${primaryColor.text}`}
            >
              {name}
            </h4>
            
            {/* Custom info slot or default manager name */}
            {children || (
              <span
                className={`text-[10px] font-black uppercase tracking-widest mt-1 ${isUser ? 'text-zinc-500' : secondaryColor.text}`}
              >
                {isUser ? 'Manager' : (managerName || 'Sin Dueño')}
              </span>
            )}
          </div>
          <div className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-2 border-l border-white/10 pl-2">
            {valueSub}
          </div>
        </div>

        {/* Action */}
        <div className="flex flex-col items-end shrink-0 gap-1">
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-600">
            {valueLabel}
          </span>
          <span className={`text-xl font-black tabular-nums transition-colors ${primaryColor.text}`}>
            {valueText}
          </span>
        </div>
      </Link>
    </motion.div>
  );
}
