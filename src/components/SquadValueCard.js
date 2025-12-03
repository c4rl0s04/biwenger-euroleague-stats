'use client';

import { useUser } from '@/contexts/UserContext';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { useEffect, useState } from 'react';

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
    <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <Wallet className="w-5 h-5 text-green-500" />
        Tu Plantilla
      </h2>

      <div className="space-y-4">
        {/* Total Value */}
        <div>
          <div className="text-slate-400 text-xs mb-1">Valor Total</div>
          <div className="text-2xl font-bold text-white">{formatPrice(data.total_value)}€</div>
          <div className={`text-sm flex items-center gap-1 ${data.price_trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {data.price_trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {data.price_trend >= 0 ? '+' : ''}{formatPrice(data.price_trend)}€
          </div>
        </div>

        {/* Rising Players */}
        {data.top_rising?.length > 0 && (
          <div>
            <div className="text-slate-400 text-xs mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3 text-green-400" />
              Más suben
            </div>
            <div className="space-y-1">
              {data.top_rising.map(p => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-slate-300 truncate">{p.name}</span>
                  <span className="text-green-400 font-medium">+{formatPrice(p.price_increment)}€</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Falling Players */}
        {data.top_falling?.length > 0 && (
          <div>
            <div className="text-slate-400 text-xs mb-2 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-red-400" />
              Más bajan
            </div>
            <div className="space-y-1">
              {data.top_falling.map(p => (
                <div key={p.id} className="flex justify-between text-sm">
                  <span className="text-slate-300 truncate">{p.name}</span>
                  <span className="text-red-400 font-medium">{formatPrice(p.price_increment)}€</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
