import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Crosshair } from 'lucide-react';
import StatsList from '@/components/ui/StatsList';

export default function TheHunterCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=hunter');

  return (
    <Card
      title="El Cazador"
      icon={Crosshair}
      color="red"
      loading={loading}
      tooltip="Puntos recortados (o perdidos) respecto al líder en las últimas 5 jornadas."
      className="h-full flex flex-col"
    >
      {!loading && data.length > 0 ? (
        <div className="flex flex-col h-full overflow-hidden">
          <p className="text-xs text-slate-400 italic px-2 mb-4 flex-shrink-0">
            Puntos recortados (<span className="text-emerald-400 font-bold not-italic">+</span>) o
            perdidos (<span className="text-rose-400 font-bold not-italic">-</span>) respecto al
            líder en las últimas 5 jornadas.
          </p>

          <StatsList
            items={data}
            renderRight={(user) => (
              <div
                className={`flex items-center gap-1 font-black text-sm ${user.gained > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {user.gained > 0 ? '+' : ''}
                {user.gained.toFixed(1)}
              </div>
            )}
          />
        </div>
      ) : (
        !loading && (
          <div className="text-center text-slate-500 py-4">No hay datos de persecución</div>
        )
      )}
    </Card>
  );
}
