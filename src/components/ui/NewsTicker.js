'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useApiData } from '@/lib/hooks/useApiData';
import { useEffect, useState } from 'react';
import Marquee from 'react-fast-marquee';
import {
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Banknote,
  Calendar,
  CheckSquare,
} from 'lucide-react';

export default function NewsTicker() {
  /*
   * using useApiData hook for standardized fetching
   * transforming data to ensure it is an array
   */
  const { data: news, loading } = useApiData('/api/news', {
    transform: (data) => (Array.isArray(data) ? data : []),
  });

  if (loading || !news || news.length === 0) return null;

  const getIcon = (type) => {
    switch (type) {
      case 'transfer':
        return <Banknote size={14} className="mr-2 text-green-400" />;
      case 'price_up':
        return <ArrowUpRight size={14} className="mr-2 text-green-400" />;
      case 'price_down':
        return <ArrowDownRight size={14} className="mr-2 text-red-400" />;
      case 'match':
        return <Calendar size={14} className="mr-2 text-blue-400" />;
      case 'result':
        return <CheckSquare size={14} className="mr-2 text-slate-400" />;
      default:
        return <Sparkles size={14} className="mr-2 text-primary" />;
    }
  };

  return (
    <div className="w-full bg-black/90 border-b border-white/10 text-white overflow-hidden h-10 flex items-center relative z-30">
      <div className="bg-gradient-to-r from-primary to-orange-400 px-3 h-full flex items-center font-bold text-xs uppercase tracking-wider shrink-0 z-10 shadow-[4px_0_10px_rgba(0,0,0,0.5)]">
        <Sparkles size={14} className="mr-2 animate-pulse" />
        Breaking
      </div>
      <Marquee
        gradient={true}
        gradientColor={[0, 0, 0]}
        gradientWidth={50}
        speed={40}
        className="h-full"
      >
        {news.map((item, i) => (
          <div key={i} className="flex items-center px-6 text-sm font-medium text-slate-200">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/80 mr-3 shrink-0" />
            {getIcon(item.type)}
            {item.text}
          </div>
        ))}
      </Marquee>
    </div>
  );
}
