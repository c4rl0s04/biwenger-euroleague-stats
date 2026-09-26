import AssistantChat from '../components/AssistantChat';
import { MobileScreen, MobileScreenHeader } from '@/components/mobile/MobileScreen';

export interface MobileAssistantScreenProps {
  conversationId?: string;
}

export function MobileAssistantScreen({ conversationId }: MobileAssistantScreenProps) {
  return (
    <MobileScreen labelledBy="mobile-screen-title" className="mobile-assistant-screen">
      <MobileScreenHeader
        eyebrow="Estrategia"
        title="Asistente"
        description="Contexto privado y solo lectura"
      />
      <AssistantChat mobile initialConversationId={conversationId} />
    </MobileScreen>
  );
}

export default MobileAssistantScreen;
