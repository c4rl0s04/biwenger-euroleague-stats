import { PageHeader } from '@/components/ui';
import { Section } from '@/components/layout';
import AssistantChat from '@/components/assistant/AssistantChat';

export const metadata = {
  title: 'Asistente IA | BiwengerStats',
  description: 'Asistente de estrategia fantasy para BiwengerStats.',
};

export default function AssistantPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Asistente IA"
        description="Asistente de estrategia fantasy para razonar lineups, mercado y decisiones de BiwengerStats."
      />

      <Section
        title="Asistente BiwengerStats"
        subtitle="Contexto read-only de liga, mercado, plantilla, predicciones y recomendaciones de alineación."
        background="section-base"
      >
        <AssistantChat />
      </Section>
    </div>
  );
}
