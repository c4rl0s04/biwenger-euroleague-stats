'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Waves } from 'lucide-react';
import Link from 'next/link';
import { getColorForUser } from '@/lib/constants/colors';

export default function VolatilityCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=volatility');

  return (
    <Card
      title="Montaña Rusa (Volatilidad)"
      icon={Waves}
      color="pink"
      loading={loading}
      tooltip="Desviación Estándar de los puntos. Valores altos indican rendimiento impredecible; bajos indican consistencia."
    >
      {!loading && data.length > 0 ? (
        <div className="flex flex-col gap-4 h-full">
          <p className="text-xs text-slate-400 italic px-2">
            Mide la <span className="text-slate-200 font-bold not-italic">regularidad</span>.
            Valores <span className="text-pink-400 font-bold not-italic">Altos</span> indican
            resultados impredecibles (montaña rusa), valores{' '}
            <span className="text-green-400 font-bold not-italic">Bajos</span> indican consistencia.
          </p>
          <div className="space-y-1">
            {data.slice(0, 8).map((user, index) => {
              // Visualize volatility with a bar proportional to max
              const maxVol = data[0].stdDev;
              const pct = (user.stdDev / maxVol) * 100;
              const userColor = getColorForUser(user.user_id, user.name);

              return (
                <div key={user.user_id} className="relative group">
                  <Link
                    href={`/user/${user.user_id}`}
                    className="flex items-center justify-between py-2 px-2 hover:bg-slate-800 rounded transition-colors z-10 relative"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500 font-mono w-4">{index + 1}</span>
                      <span
                        className={`text-sm font-medium ${userColor.text} transition-transform group-hover:scale-105 origin-left inline-block`}
                      >
                        {user.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-pink-400">{user.stdDev}</div>
                      <div className="text-[10px] text-slate-500">Media: {user.mean}</div>
                    </div>
                  </Link>
                  {/* Background Bar */}
                  <div
                    className="absolute bottom-1 left-0 h-0.5 bg-pink-500/20 rounded-full transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        !loading && <div className="text-center text-slate-500 py-4">Calculando volatilidad...</div>
      )}
    </Card>
  );
}
