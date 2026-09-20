import AutoAlignButton from '@/components/schedule/AutoAlignButton';
import type { ScheduleMatch } from '../models/schedule';

/** Frozen command compatibility boundary. Ownership moves with Task 15, not this read migration. */
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
