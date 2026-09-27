import AutoAlignButton from '@/components/schedule/AutoAlignButton';
import type { ScheduleMatch } from '../models/schedule';

/** Presentation adapter; automatic selection rules belong to the Lineup public contract. */
export default function ScheduleLineupAction({
  matches,
  userName,
  discrete = false,
}: {
  matches: ScheduleMatch[];
  userName?: string | null;
  discrete?: boolean;
  userId?: string;
}) {
  return <AutoAlignButton matches={matches} userName={userName} discrete={discrete} />;
}
