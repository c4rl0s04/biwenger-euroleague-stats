import { useApiData } from '@/lib/hooks/useApiData';
import { Card } from '@/components/ui';
import { Crown } from 'lucide-react';
import { ManagerStatList } from '@/lib/competition/ui';

export default function DominanceCard() {
  const { data = [], loading } = useApiData('/api/standings/advanced?type=dominance');

  return (
    <Card
      title="Margen de Victoria (Dominance)"
      icon={Crown}
      color="yellow"
      loading={loading}
      tooltip="Promedio de puntos de diferencia sobre el 2º clasificado en las jornadas ganadas."
    >
      {!loading && data.length > 0 ? (
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
            <>
              {/* Wins Column */}
              <div className="flex flex-col items-center px-3 mx-1 min-w-[50px]">
                <span className="text-xl font-black text-foreground tabular-nums leading-none">
                  {user.wins}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                  Vic
                </span>
              </div>

              {/* Margin Column */}
              <div className="text-right min-w-[80px] pr-1">
                <span className="block text-xl font-black text-[color-mix(in_srgb,var(--color-yellow-500)_55%,hsl(var(--content-primary)))] tracking-tighter leading-none tabular-nums">
                  +{user.avg_margin.toFixed(1)}
                </span>
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">
                  Margen
                </span>
              </div>
            </>
          )}
        />
      ) : (
        !loading && (
          <div className="text-center text-muted-foreground py-4">Sin victorias registradas</div>
        )
      )}
    </Card>
  );
}
