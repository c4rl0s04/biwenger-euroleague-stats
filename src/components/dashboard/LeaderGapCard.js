'use client';

import { useClientUser } from '@/lib/hooks/useClientUser';
import { Target, Crown } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function LeaderGapCard() {
  const { currentUser, isReady } = useClientUser();

  const { data, loading } = useApiData(
    () => (currentUser ? `/api/dashboard/leader-gap?userId=${currentUser.id}` : null),
    {
      dependencies: [currentUser?.id],
      skip: !currentUser,
    }
  );

  if (!isReady) return null;

  if (loading) {
    return <Card loading={true} />;
  }

  // If data failed to load, show empty state
  if (!data) {
    return (
      <Card title="A la Caza del Líder" icon={Target} color="emerald">
        <div className="text-center text-muted-foreground py-4">No hay datos disponibles</div>
      </Card>
    );
  }

  if (data.is_leader) {
    return (
      <Card title="Líder de la Liga" icon={Crown} color="yellow">
        <div className="flex-1 flex flex-col">
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex flex-col justify-center">
              <div className="text-muted-foreground text-[10px] font-medium mb-1 uppercase tracking-wider">
                Tus Puntos
              </div>
              <div className="text-3xl font-bold text-yellow-400">{data.user_points}</div>
              <div className="text-muted-foreground text-xs invisible">spacer</div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="text-muted-foreground text-[10px] font-medium mb-1 uppercase tracking-wider">
                Ventaja
              </div>
              <div className="text-3xl font-bold text-green-400">+{data.gap_to_second || 0}</div>
              <div className="text-muted-foreground text-xs invisible">spacer</div>
            </div>
          </div>

          <div className="mt-auto pt-4 border-t border-border/20">
            <div className="flex items-baseline justify-between">
              <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
                Estado
              </span>
              <span className="text-foreground text-xs font-medium">
                Mantén el ritmo para ganar la liga
              </span>
            </div>
          </div>
        </div>
      </Card>
    );
  }

  // Not leader view
  return (
    <Card title="A la Caza del Líder" icon={Target} color="emerald">
      <div className="flex-1 flex flex-col">
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <div className="text-muted-foreground text-[10px] font-medium mb-1 uppercase tracking-wider">
              Líder: {data.leader_name}
            </div>
            <div className="text-3xl font-bold text-foreground">{data.leader_points} pts</div>
          </div>

          <div>
            <div className="text-muted-foreground text-[10px] font-medium mb-1 uppercase tracking-wider">
              Tú
            </div>
            <div className="text-3xl font-bold text-yellow-500">{data.user_points} pts</div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-border/20">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground text-[10px] font-medium uppercase tracking-wider">
              Distancia
            </span>
            <span className="text-2xl font-bold text-red-400">-{data.gap} pts</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
