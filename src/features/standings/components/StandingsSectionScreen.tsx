import React from 'react';
import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileRecordList from '@/components/mobile/MobileRecordList';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';

export const descriptions: Record<string, string> = {
  progression:
    'La evolución jornada a jornada, presentada sin leyendas saturadas ni tarjetas gigantes.',
  rounds: 'Quién domina cada jornada y con qué frecuencia cambia el control de la liga.',
  draft: 'El rendimiento real de los jugadores que llegaron en el reparto inicial.',
  form: 'Rachas recientes para distinguir tendencia de ruido puntual.',
  performance: 'Regularidad y eficiencia para comparar estilos de gestión.',
  alternatives: 'Qué ocurriría si midiéramos la liga con otras reglas competitivas.',
  curiosities: 'Resultados improbables, mala suerte y otros patrones de la temporada.',
  captains: 'El impacto acumulado de acertar o fallar con el capitán.',
};

export default function StandingsSectionScreen({
  section,
  title,
  data,
}: {
  section: string;
  title: string;
  data: unknown;
}) {
  return (
    <MobileDetailScaffold
      title={title}
      context="Clasificación"
      backHref="/standings"
      description={descriptions[section]}
    >
      <MobileSectionHeading>Datos destacados</MobileSectionHeading>
      <MobileRecordList data={data} linkPrefix={section === 'captains' ? '/user' : undefined} />
    </MobileDetailScaffold>
  );
}
