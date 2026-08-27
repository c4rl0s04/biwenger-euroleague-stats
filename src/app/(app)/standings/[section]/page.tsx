import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import {
  fetchAllPlayAllStats,
  fetchDetailedCaptainStats,
  fetchEfficiencyStats,
  fetchHeartbreakerStats,
  fetchHeatCheckStats,
  fetchInitialSquadAnalytics,
  fetchInitialSquadStats,
  fetchPointsProgression,
  fetchReliabilityStats,
  fetchRoundWinners,
  fetchStreakStats,
} from '@/lib/services/app/standingsService';

type PageProps = { params: Promise<{ section: string }> };

async function loadSection(section: string): Promise<unknown> {
  switch (section) {
    case 'progression':
      return fetchPointsProgression(50);
    case 'rounds':
      return fetchRoundWinners(34);
    case 'draft': {
      const [analytics, stats] = await Promise.all([
        fetchInitialSquadAnalytics(),
        fetchInitialSquadStats(),
      ]);
      return { analytics, stats };
    }
    case 'form': {
      const [heat, streaks] = await Promise.all([fetchHeatCheckStats(), fetchStreakStats()]);
      return { heat, streaks };
    }
    case 'performance': {
      const [reliability, efficiency] = await Promise.all([
        fetchReliabilityStats(),
        fetchEfficiencyStats(),
      ]);
      return { reliability, efficiency };
    }
    case 'alternatives':
      return fetchAllPlayAllStats();
    case 'curiosities':
      return fetchHeartbreakerStats();
    case 'captains':
      return fetchDetailedCaptainStats();
    default:
      return [];
  }
}

const descriptions: Record<string, string> = {
  progression: 'La evolución jornada a jornada, presentada sin leyendas saturadas ni tarjetas gigantes.',
  rounds: 'Quién domina cada jornada y con qué frecuencia cambia el control de la liga.',
  draft: 'El rendimiento real de los jugadores que llegaron en el reparto inicial.',
  form: 'Rachas recientes para distinguir tendencia de ruido puntual.',
  performance: 'Regularidad y eficiencia para comparar estilos de gestión.',
  alternatives: 'Qué ocurriría si midiéramos la liga con otras reglas competitivas.',
  curiosities: 'Resultados improbables, mala suerte y otros patrones de la temporada.',
  captains: 'El impacto acumulado de acertar o fallar con el capitán.',
};

export default async function StandingsSectionPage({ params }: PageProps) {
  const { section } = await params;
  const route = await requireMobileRoute(`/standings/${section}`);
  const data = await loadSection(section);

  return (
    <MobileDetailScaffold
      title={route.definition.title}
      context="Clasificación"
      backHref="/standings"
      description={descriptions[section]}
    >
      <MobileSectionHeading>Datos destacados</MobileSectionHeading>
      <MobileRecordList data={data} linkPrefix={section === 'captains' ? '/user' : undefined} />
    </MobileDetailScaffold>
  );
}
