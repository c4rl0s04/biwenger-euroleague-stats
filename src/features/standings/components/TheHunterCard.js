import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Crosshair } from 'lucide-react';
import { ManagerStatList } from '@/lib/competition/ui';

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
          <p className="text-xs text-muted-foreground font-medium italic px-2 mb-4 flex-shrink-0">
            Puntos recortados (
            <span className="text-[color-mix(in_srgb,var(--color-emerald-400)_55%,hsl(var(--content-primary)))] font-bold not-italic">
              +
            </span>
            ) o perdidos (
            <span className="text-[color-mix(in_srgb,var(--color-rose-400)_55%,hsl(var(--content-primary)))] font-bold not-italic">
              -
            </span>
            ) respecto al líder en las últimas 5 jornadas.
          </p>

          <ManagerStatList
            getKey={(user) => user.user_id}
            getIdentity={(user) => ({
              id: user.user_id ?? null,
              name: user.name,
              icon: user.icon,
              colorIndex: user.color_index,
              subtitle: user.subtitle,
            })}
            items={data.map((user) => ({
              ...user,
              user_id: user.user_id, // Ensure consistency
            }))}
            renderMetric={(user) => (
              <div
                className={`flex items-center gap-1 font-black text-sm ${user.gained > 0 ? 'text-[color-mix(in_srgb,var(--color-emerald-400)_55%,hsl(var(--content-primary)))]' : 'text-[color-mix(in_srgb,var(--color-rose-400)_55%,hsl(var(--content-primary)))]'}`}
              >
                {user.gained > 0 ? '+' : ''}
                {user.gained.toFixed(1)}
              </div>
            )}
          />
        </div>
      ) : (
        !loading && (
          <div className="text-center text-muted-foreground py-4">No hay datos de persecución</div>
        )
      )}
    </Card>
  );
}
