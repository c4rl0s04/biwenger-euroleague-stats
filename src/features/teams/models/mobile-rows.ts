import type { MobileRecordRow } from '@/components/mobile/MobileRecordList';
import type { TeamProfileViewModel, TeamProfileSection } from './team-profile';

export function mapTeamSectionRows(
  model: TeamProfileViewModel,
  section: TeamProfileSection
): MobileRecordRow[] {
  return section === 'roster'
    ? model.roster.slice(0, 20).map((player, index) => ({
        key: String(player.id ?? index),
        title: player.name ?? `Registro ${index + 1}`,
        subtitle: player.position,
        value: player.points ?? player.price,
        href: player.id != null ? `/player/${player.id}` : null,
      }))
    : [...model.upcomingMatches, ...model.recentMatches].slice(0, 20).map((match, index) => ({
        key: String(index),
        title: match.roundName ?? `Registro ${index + 1}`,
      }));
}
