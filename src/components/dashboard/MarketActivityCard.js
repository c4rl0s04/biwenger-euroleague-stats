'use client';

import { useUser } from '@/contexts/UserContext';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import PremiumCard from '@/components/ui/PremiumCard';

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

  const { recentTransfers } = data || {};

  const actionLink = (
    <Link href="/market" className="text-sm text-purple-400 hover:text-purple-300 transition-colors">
      Ver mercado
    </Link>
  );

  return (
    <PremiumCard
      title="Últimos Fichajes"
      icon={ShoppingBag}
      color="pink"
      loading={loading}
      actionRight={actionLink}
    >
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
    </PremiumCard>
  );
}
