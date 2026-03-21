'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Waves } from 'lucide-react';
import StatsList from '@/components/ui/StatsList';

export default function VolatilityCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=volatility');

  const maxVol = data.length > 0 ? Math.max(...data.map((u) => u.std_dev)) : 0;

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
          <p className="text-xs text-slate-300 font-medium italic px-2 leading-tight">
            Mide la <span className="text-slate-200 font-bold not-italic">regularidad</span>.
            Valores <span className="text-pink-400 font-bold not-italic">Altos</span> indican
            resultados impredecibles, valores{' '}
            <span className="text-green-400 font-bold not-italic">Bajos</span> indican consistencia.
          </p>

          <StatsList
            items={data.slice(0, 10)}
            renderRight={(user) => (
              <div className="text-right">
                <div className="text-sm font-bold text-pink-400">{user.std_dev}</div>
                <div className="text-[10px] text-slate-400">Media: {user.avg_points}</div>
              </div>
            )}
            renderExtra={(user) => {
              const pct = (user.std_dev / maxVol) * 100;
              return (
                <div
                  className="absolute bottom-0 left-0 h-[1.5px] bg-pink-500/20 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%` }}
                />
              );
            }}
          />
        </div>
      ) : (
        !loading && <div className="text-center text-slate-400 py-4">Calculando volatilidad...</div>
      )}
    </Card>
  );
}
