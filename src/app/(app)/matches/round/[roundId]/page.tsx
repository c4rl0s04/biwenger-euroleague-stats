import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import MobileMatchRow from '@/components/mobile/MobileMatchRow';
import { MobileSectionHeading } from '@/components/mobile/MobileScreen';
import { requireMobileRoute } from '@/lib/mobile/route-server';
import { fetchMatchesGrouped } from '@/lib/services';

type PageProps = { params: Promise<{ roundId: string }> };

export default async function MatchRoundPage({ params }: PageProps) {
  const { roundId } = await params;
  const route = await requireMobileRoute(`/matches/round/${roundId}`);
  const { rounds } = await fetchMatchesGrouped();
  const round = rounds.find((entry) => String(entry.round_id) === String(roundId));

  return (
    <MobileDetailScaffold title={round?.round_name ?? route.definition.title} context="Partidos" backHref={`/matches?roundId=${roundId}`}>
      <MobileSectionHeading>Partidos</MobileSectionHeading>
      <div className="mobile-match-list">
        {(round?.matches ?? []).map((match: Record<string, any>) => <MobileMatchRow key={String(match.id)} match={match} />)}
      </div>
    </MobileDetailScaffold>
  );
}
