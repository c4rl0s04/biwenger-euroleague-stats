import { MobileAssistantScreen } from '@/features/assistant/public';
import { requireMobileRoute } from '@/lib/mobile/route-server';

type PageProps = { params: Promise<{ conversationId: string }> };

export default async function AssistantConversationPage({ params }: PageProps) {
  const { conversationId } = await params;
  await requireMobileRoute(`/assistant/${conversationId}`);
  return <MobileAssistantScreen conversationId={conversationId} />;
}
