'use client';

import { useApiData } from '@/lib/hooks/useApiData';
import { useClientUser } from '@/lib/hooks/useClientUser';
import { useState } from 'react';
import HeadToHeadCard from '@/components/rounds/stats/history/HeadToHeadCard';
import LazyAdvancedStats from '@/components/compare/LazyAdvancedStats';
import { Section } from '@/components/layout';
import { Subheading, PageHeader } from '@/components/ui';
import { Scale } from 'lucide-react';

export default function ComparePageClient() {
  const { currentUser } = useClientUser();
  const { data, loading, error } = useApiData('/api/compare/data/lite');
  const [advancedStats, setAdvancedStats] = useState(null);
  const [loadingAdvanced, setLoadingAdvanced] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen pt-24 pb-8 container mx-auto px-4 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-zinc-800 rounded-full" />
          <div className="h-4 w-48 bg-zinc-800 rounded" />
          <div className="text-zinc-500 text-sm">Cargando centro de datos...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen pt-24 pb-8 container mx-auto px-4 flex items-center justify-center">
        <div className="text-red-400">Error cargando datos de comparación.</div>
      </div>
    );
  }

  // Find the full user object for current user (to ensure we have consistent data type)
  const activeUser = data.users.find((u) => u.id === currentUser?.id) || data.users[0];

  return (
    <div className="min-h-screen container mx-auto px-4 pb-8">
      {/* Header */}
      <PageHeader
        title="Analítica Comparativa"
        description="Enfrenta tus estadísticas contra cualquier rival de la liga. Analiza rendimiento, valor de mercado y aciertos en predicciones."
        className="pb-0"
      />

      {/* Main Comparison Component */}
      <Section title="Cara a Cara" delay={100} background="none" className="pt-0">
        <HeadToHeadCard
          currentUser={activeUser}
          allUsersHistory={data.history}
          usersList={data.users}
          standings={data.standings}
          predictions={data.predictions}
          advancedStats={advancedStats}
        />
      </Section>

      {/* Lazy-loaded Advanced Stats */}
      {advancedStats === null && (
        <LazyAdvancedStats
          onLoadAdvanced={() => {
            setLoadingAdvanced(true);
          }}
          onAdvancedStatsLoaded={(stats) => {
            setAdvancedStats(stats);
            setLoadingAdvanced(false);
          }}
          isLoading={loadingAdvanced}
        />
      )}

      {/* Placeholder for future charts or deeper analysis */}
    </div>
  );
}
