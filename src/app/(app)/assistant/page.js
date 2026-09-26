import { DesktopAssistantScreen, MobileAssistantScreen } from '@/features/assistant/public';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';

export const metadata = {
  title: 'Asistente IA | BiwengerStats',
  description: 'Asistente de estrategia fantasy para BiwengerStats.',
};

export default async function AssistantPage({ searchParams }) {
  const params = await searchParams;
  if (await isPhonePresentation()) {
    return <MobileAssistantScreen conversationId={params?.conversation} />;
  }

  return <DesktopAssistantScreen conversationId={params?.conversation} />;
}
