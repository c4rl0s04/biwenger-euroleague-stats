import { beforeEach, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  phone: vi.fn(),
  reference: vi.fn(),
  schedule: vi.fn(),
  map: vi.fn(),
  guard: vi.fn(),
}));
vi.mock('@/auth', () => ({ auth: mocks.auth }));
vi.mock('@/lib/mobile/presentation-server', () => ({ isPhonePresentation: mocks.phone }));
vi.mock('@/lib/mobile/route-server', () => ({ requireMobileRoute: mocks.guard }));
vi.mock('@/features/schedule/server', async () => {
  const { parseScheduleRoundId } = await import('@/features/schedule/validation/schedule-input');
  return {
    parseScheduleRoundId,
    getScheduleReferenceData: mocks.reference,
    getUserSchedule: mocks.schedule,
    getScheduleMapData: mocks.map,
  };
});
vi.mock('@/features/schedule/public', () => ({
  DesktopScheduleScreen: 'desktop-schedule',
  MobileScheduleScreen: 'mobile-schedule',
  ScheduleMapScreen: 'schedule-map',
}));
import SchedulePage from './page';
import ScheduleMapPage from './map/page';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.auth.mockResolvedValue({ user: { id: '12', name: 'Session Name' } });
  mocks.phone.mockResolvedValue(false);
  mocks.reference.mockResolvedValue({ users: [{ id: '12', name: 'Directory Name' }], rounds: [] });
  mocks.schedule.mockResolvedValue({ found: false, message: 'fixture empty' });
  mocks.guard.mockResolvedValue(undefined);
  mocks.map.mockResolvedValue({ matches: [], backHref: '/schedule' });
});
it('ignores URL identity and preserves permissive round parsing', async () => {
  const result = await SchedulePage({
    searchParams: Promise.resolve({ userId: '99', roundId: '7abc' }),
  });
  expect(mocks.schedule).toHaveBeenCalledWith('12', 7);
  expect(result.type).toBe('desktop-schedule');
  expect(result.props.model.userId).toBe('12');
});
it('does not read a user schedule without a session', async () => {
  mocks.auth.mockResolvedValue(null);
  const result = await SchedulePage({ searchParams: Promise.resolve({ userId: '99' }) });
  expect(mocks.schedule).not.toHaveBeenCalled();
  expect(result.props.model.schedule).toEqual({ found: false, message: 'No user selected' });
});
it('passes directory identity and the same read result to phone composition', async () => {
  mocks.phone.mockResolvedValue(true);
  const result = await SchedulePage({ searchParams: Promise.resolve({ roundId: ['7', '8'] }) });
  expect(result.type).toBe('mobile-schedule');
  expect(result.props.userName).toBe('Directory Name');
  expect(mocks.schedule).toHaveBeenCalledWith('12', 7);
});
it('guards the map before reads and does not reuse Schedule parsing', async () => {
  await ScheduleMapPage({ searchParams: Promise.resolve({ roundId: '7abc' }) });
  expect(mocks.guard).toHaveBeenCalledWith('/schedule/map');
  expect(mocks.map).toHaveBeenCalledWith('7abc');
  mocks.map.mockClear();
  mocks.guard.mockRejectedValue(new Error('desktop redirect'));
  await expect(ScheduleMapPage({ searchParams: Promise.resolve({}) })).rejects.toThrow(
    'desktop redirect'
  );
  expect(mocks.map).not.toHaveBeenCalled();
});
