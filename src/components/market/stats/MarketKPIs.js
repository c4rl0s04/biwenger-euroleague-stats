'use client';

import { TrendingUp, ArrowLeftRight, Scale, Swords } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function MarketKPIs({ kpis }) {
  if (!kpis) return null;

  // Format millions e.g. 1.2M
  const formatMillions = (val) => {
    return (val / 1000000).toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    });
  };

  const formatEuro = (val) => {
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${(val / 1000).toFixed(0)}k`;
    return val.toLocaleString('es-ES');
  };

  return (
    <>
      <ElegantCard title="Volumen Movido" icon={TrendingUp} color="emerald">
        <div className="flex flex-col justify-between h-full">
          <div>
            <p className="text-3xl font-black text-emerald-400 mt-2 tracking-tighter font-display">
              {formatMillions(kpis.totalVolume)}M €
            </p>
            <p className="text-xs uppercase font-black text-slate-500 mt-3 tracking-[0.15em] font-ui">
              Total Intercambiado
            </p>
          </div>
        </div>
      </ElegantCard>

      <ElegantCard title="Operaciones" icon={ArrowLeftRight} color="blue">
        <div className="flex flex-col justify-between h-full">
          <div>
            <p className="text-3xl font-black text-blue-400 mt-2 tracking-tighter font-display">
              {kpis.totalOps}
            </p>
            <p className="text-xs uppercase font-black text-slate-500 mt-3 tracking-[0.15em] font-ui">
              Transacciones
            </p>
          </div>
        </div>
      </ElegantCard>

      <ElegantCard title="Precio Medio" icon={Scale} color="indigo">
        <div className="flex flex-col justify-between h-full">
          <div>
            <p className="text-3xl font-black text-indigo-400 mt-2 tracking-tighter font-display">
              {formatEuro(kpis.avgPrice)} €
            </p>
            <p className="text-xs uppercase font-black text-slate-500 mt-3 tracking-[0.15em] font-ui">
              Coste Promedio
            </p>
          </div>
        </div>
      </ElegantCard>

      <ElegantCard title="Competitividad" icon={Swords} color="orange">
        <div className="flex flex-col justify-between h-full">
          <div>
            <p className="text-3xl font-black text-orange-400 mt-2 tracking-tighter font-display">
              {kpis.avgBids?.toFixed(1) || '0.0'}
            </p>
            <p className="text-xs uppercase font-black text-slate-500 mt-3 tracking-[0.15em] font-ui">
              Pujas por Fichaje
            </p>
          </div>
        </div>
      </ElegantCard>
    </>
  );
}
