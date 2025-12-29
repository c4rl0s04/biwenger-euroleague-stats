'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import Link from 'next/link';
import { PremiumCard } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function SquadValueCard() {
  const { currentUser, isReady } = useClientUser();

  const { data, loading } = useApiData(
    () => (currentUser ? `/api/player/squad?userId=${currentUser.id}` : null),
    {
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  if (!isReady) return null;

  const formatPrice = (price) => new Intl.NumberFormat('es-ES').format(price);

  return (
    <PremiumCard title="Tu Plantilla" icon={Wallet} color="cyan" loading={loading}>
      {!loading && data && (
        <div className="space-y-2 flex-1 flex flex-col h-full">
          {/* Total Value */}
          <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-indigo-500/30 transition-all flex-1 flex flex-col justify-center">
            <div className="text-slate-400 text-[10px] font-medium mb-1.5 uppercase tracking-wider">
              Valor Total
            </div>
            <div className="text-2xl font-bold text-white/90">{formatPrice(data.total_value)}€</div>
            <div
              className={`text-sm flex items-center gap-1 mt-1 ${data.price_trend >= 0 ? 'text-green-400' : 'text-red-400'}`}
            >
              {data.price_trend >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {data.price_trend >= 0 ? '+' : ''}
              {formatPrice(data.price_trend)}€
            </div>
          </div>

          {/* Rising Players */}
          {data.top_rising?.length > 0 && (
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-green-500/30 transition-all flex-1 flex flex-col justify-center">
              <div className="text-slate-400 text-[10px] font-medium mb-2 flex items-center gap-1 uppercase tracking-wider">
                <TrendingUp className="w-3 h-3 text-green-400" />
                Más suben
              </div>
              <div className="space-y-1.5 w-full">
                {data.top_rising.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between text-sm bg-slate-800/40 rounded-lg px-2.5 py-1.5 hover:bg-slate-800/60 transition-colors"
                  >
                    <Link
                      href={`/player/${p.id}`}
                      className="text-slate-300 truncate text-xs hover:text-green-400 transition-colors block"
                    >
                      {p.name}
                    </Link>
                    <span className="text-green-400 font-semibold text-xs">
                      +{formatPrice(p.price_increment)}€
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Falling Players */}
          {data.top_falling?.length > 0 && (
            <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl p-3 border border-slate-700/30 hover:border-red-500/30 transition-all flex-1 flex flex-col justify-center">
              <div className="text-slate-400 text-[10px] font-medium mb-2 flex items-center gap-1 uppercase tracking-wider">
                <TrendingDown className="w-3 h-3 text-red-400" />
                Más bajan
              </div>
              <div className="space-y-1.5 w-full">
                {data.top_falling.map((p) => (
                  <div
                    key={p.id}
                    className="flex justify-between text-sm bg-slate-800/40 rounded-lg px-2.5 py-1.5 hover:bg-slate-800/60 transition-colors"
                  >
                    <Link
                      href={`/player/${p.id}`}
                      className="text-slate-300 truncate text-xs hover:text-red-400 transition-colors block"
                    >
                      {p.name}
                    </Link>
                    <span className="text-red-400 font-semibold text-xs">
                      {formatPrice(p.price_increment)}€
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </PremiumCard>
  );
}
