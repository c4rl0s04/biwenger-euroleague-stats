'use client';

import { useUser } from '@/contexts/UserContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function MarketActivityCard() {
  const { currentUser } = useUser();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const userId = currentUser?.id || '';
    
    fetch(`/api/recent-activity?userId=${userId}`)
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setData(result.data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching market activity:', err);
        setLoading(false);
      });
  }, [currentUser]);

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700/50 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-700/50 rounded"></div>
          <div className="h-4 bg-slate-700/50 rounded"></div>
          <div className="h-4 bg-slate-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  const { recentTransfers } = data || {};

  return (
    <div className="bg-gradient-to-br from-purple-900/20 to-slate-900 backdrop-blur-md border border-purple-700/30 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-600/50 transition-all">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <ShoppingBag className="w-32 h-32 text-purple-500" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-purple-500" />
            Últimos Fichajes
          </h2>
          <Link href="/market" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
            Ver mercado
          </Link>
        </div>

        {/* Transfers Content */}
        <div className="space-y-0">
          {recentTransfers && recentTransfers.length > 0 ? (
            recentTransfers.slice(0, 8).map((transfer) => (
              <div 
                key={transfer.id} 
                className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 px-2 rounded transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                    {transfer.player_name?.charAt(0) || '?'}
                  </div>
                  <div>
                    <Link href={`/player/${transfer.player_id}`} className="font-medium text-white text-sm hover:text-purple-400 transition-colors block">
                      {transfer.player_name}
                    </Link>
                    <div className="text-xs text-slate-400 flex items-center gap-1">
                      <span className="text-red-400">{transfer.vendedor || 'Mercado'}</span>
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-green-400">{transfer.comprador}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-white text-sm">
                    {new Intl.NumberFormat('es-ES').format(transfer.precio)}€
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {new Date(transfer.timestamp * 1000).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">No hay fichajes recientes</div>
          )}
        </div>
      </div>
    </div>
  );
}
