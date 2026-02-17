'use client';

import { Section } from '@/components/layout';
import { PageHeader } from '@/components/ui';

export default function TournamentsPage() {
  return (
    <div>
      {/* Header Section */}
      <PageHeader
        title="Torneos"
        description="Explora los diferentes torneos, copas y eliminatorias disputados durante la temporada."
      />

      {/* Main Content */}
      <Section
        title="Torneos Disponibles"
        id="tournaments-list"
        delay={0}
        background="section-base"
      >
        <div className="text-center py-12 text-muted-foreground">
          <p>Selecciona un torneo para ver sus detalles</p>
          {/* Tournament List/Grid will go here */}
        </div>
      </Section>
    </div>
  );
}
