'use client';

import { useUser } from '@/contexts/UserContext';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function SquadValueCard() {
  const { currentUser } = useUser();
 const [data, setData] = useState(null);

  useEffect(() => {
    if (!currentUser) return;

    fetch(`/api/user-squad?userId=${currentUser.id}`)
      .then(res => res.json())
      .then(d => d.success && setData(d.data));
  }, [currentUser]);

  if (!currentUser || !data) return null;

  const formatPrice = (price) => new Intl.NumberFormat('es-ES').format(price);

  return (
    <div className="bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 shadow-xl shadow-black/5 hover:border-slate-600/50 transition-all duration-300">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-base font-bold text-white/90 flex items-center gap-2">
          <div className="p-1.5 bg-green-500/10 rounded-lg">
            <Wallet className="w-4 h-4 text-green-500" />
          </div>
          Tu Plantilla
        </h2>
      </div>

      <div className="space-y-4">
        {/* Total Value */}
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30">
          <div className="text-slate-400 text-[10px] font-medium mb-1.5 uppercase tracking-wider">Valor Total</div>
          <div className="text-2xl font-bold text-white/90">{formatPrice(data.total_value)}€</div>
          <div className={`text-sm flex items-center gap-1 mt-1 ${data.price_trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.price_trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {data.price_trend >= 0 ? '+' : ''}{formatPrice(data.price_trend)}€
          </div>
        </div>

        {/* Rising Players */}
        {data.top_rising?.length > 0 && (
          <div>
            <div className="text-slate-400 text-[10px] font-medium mb-2 flex items-center gap-1 uppercase tracking-wider">
              <TrendingUp className="w-3 h-3 text-green-400" />
              Más suben
            </div>
            <div className="space-y-1.5">
              {data.top_rising.map(p => (
                <div key={p.id} className="flex justify-between text-sm bg-slate-800/20 rounded-lg px-2.5 py-1.5 hover:bg-slate-800/40 transition-colors">
                  <Link href={`/player/${p.id}`} className="text-slate-300 truncate text-xs hover:text-green-400 transition-colors block">
                    {p.name}
                  </Link>
                  <span className="text-green-400 font-semibold text-xs">+{formatPrice(p.price_increment)}€</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Falling Players */}
        {data.top_falling?.length > 0 && (
          <div>
            <div className="text-slate-400 text-[10px] font-medium mb-2 flex items-center gap-1 uppercase tracking-wider">
              <TrendingDown className="w-3 h-3 text-red-400" />
              Más bajan
            </div>
            <div className="space-y-1.5">
              {data.top_falling.map(p => (
                <div key={p.id} className="flex justify-between text-sm bg-slate-800/20 rounded-lg px-2.5 py-1.5 hover:bg-slate-800/40 transition-colors">
                  <Link href={`/player/${p.id}`} className="text-slate-300 truncate text-xs hover:text-red-400 transition-colors block">
                    {p.name}
                  </Link>
                  <span className="text-red-400 font-semibold text-xs">{formatPrice(p.price_increment)}€</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
