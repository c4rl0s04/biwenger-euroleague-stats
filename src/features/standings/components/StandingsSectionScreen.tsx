import React from 'react';
import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import type { StandingsSectionModel } from '../models/screens';
import { MobileListRow } from '@/components/mobile/MobileScreen';
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
  data: StandingsSectionModel;
}) {
  return (
    <MobileDetailScaffold
      title={title}
      context="Clasificación"
      backHref="/standings"
      description={descriptions[section]}
    >
      <MobileSectionHeading>Datos destacados</MobileSectionHeading>
      {data.rows.length === 0 ? (
        <p className="mobile-record-empty">No hay datos disponibles para esta vista.</p>
      ) : (
        <div>
          {data.rows.map((row, index) => (
            <MobileListRow
              key={row.key}
              href={row.href ?? undefined}
              leading={<span className="mobile-record-index">{index + 1}</span>}
              title={row.title}
              trailing={row.value ?? undefined}
            />
          ))}
        </div>
      )}
    </MobileDetailScaffold>
  );
}
