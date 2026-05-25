import { PageHeader } from '@/components/ui';
import { Section } from '@/components/layout';
import AssistantChat from '@/components/assistant/AssistantChat';

export const metadata = {
  title: 'Asistente IA | BiwengerStats',
  description: 'Laboratorio de chat con inteligencia artificial para BiwengerStats.',
};

export default function AssistantPage() {
  return (
    <div className="min-h-screen bg-background">
      <PageHeader
        title="Asistente IA"
        description="Primera etapa del laboratorio: conversa con un modelo de IA antes de añadir datos, personalidad y herramientas."
      />

      <Section
        title="Chat Experimental"
        subtitle="Etapa 2: conversaciones persistentes y conexión con el modelo"
        background="section-base"
      >
        <AssistantChat />
      </Section>
    </div>
  );
}
