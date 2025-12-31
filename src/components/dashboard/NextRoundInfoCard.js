'use client';

import { Calendar } from 'lucide-react';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function NextRoundInfoCard() {
  const { data = {}, loading } = useApiData('/api/dashboard/next-round');
  const nextRound = data?.nextRound;

  return (
    <Card title="Próxima Jornada" icon={Calendar} color="blue" loading={loading}>
      {!loading && (
        <div className="flex-1 flex flex-col justify-center items-center text-center py-4">
          {nextRound ? (
            <>
              <div className="text-3xl font-bold text-foreground mb-2">{nextRound.round_name}</div>
              <div className="text-blue-400 font-mono text-sm">
                {new Date(nextRound.start_date).toLocaleDateString('es-ES', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </>
          ) : (
            <div className="text-xl font-bold text-muted-foreground">Temporada Finalizada</div>
          )}
        </div>
      )}
    </Card>
  );
}
