import AssistantChat from '@/components/assistant/AssistantChat';

import { MobileScreen, MobileScreenHeader } from '../MobileScreen';

export default function MobileAssistantScreen({ conversationId }: { conversationId?: string }) {
  return (
    <MobileScreen labelledBy="mobile-screen-title" className="mobile-assistant-screen">
      <MobileScreenHeader eyebrow="Estrategia" title="Asistente" description="Contexto privado y solo lectura" />
      <AssistantChat mobile initialConversationId={conversationId} />
    </MobileScreen>
  );
}
