import { ThemeBackground } from '@/components/ui';

import type { TeamProfileViewModel } from '../models/team-profile';
import TeamProfileClient from './desktop/TeamProfileClient';
import MobileTeamProfileScreen from './mobile/MobileTeamProfileScreen';

export function TeamProfileScreen({
  model,
  presentation,
}: {
  model: TeamProfileViewModel;
  presentation: 'desktop' | 'phone';
}) {
  if (presentation === 'phone') return <MobileTeamProfileScreen team={model} />;

  return (
    <>
      <div className="fixed inset-0 z-0">
        <ThemeBackground />
      </div>
      <main className="relative z-10 w-full pt-12">
        <TeamProfileClient team={model} />
      </main>
    </>
  );
}
