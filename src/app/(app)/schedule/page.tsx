import { auth } from '@/auth';
import { isPhonePresentation } from '@/lib/mobile/presentation-server';
import { DesktopScheduleScreen, MobileScheduleScreen } from '@/features/schedule/public';
import {
  getScheduleReferenceData,
  getUserSchedule,
  parseScheduleRoundId,
  type ScheduleSearchParams,
} from '@/features/schedule/server';

export default async function SchedulePage({
  searchParams,
}: {
  searchParams: Promise<ScheduleSearchParams>;
}) {
  const [params, reference, session, phone] = await Promise.all([
    searchParams,
    getScheduleReferenceData(),
    auth(),
    isPhonePresentation(),
  ]);
  const userId = session?.user?.id;
  const roundId = parseScheduleRoundId(params?.roundId);
  const schedule = userId
    ? await getUserSchedule(userId, roundId)
    : { found: false as const, message: 'No user selected' };
  const model = { ...reference, userId, schedule };
  return phone ? (
    <MobileScheduleScreen
      schedule={schedule}
      rounds={reference.rounds}
      userName={reference.users.find((user) => String(user.id) === String(userId))?.name}
    />
  ) : (
    <DesktopScheduleScreen model={model} />
  );
}
