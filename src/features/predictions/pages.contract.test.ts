import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  guard: vi.fn(),
  section: vi.fn(),
  stats: vi.fn(),
  phone: vi.fn(),
}));
vi.mock('@/features/predictions/server', () => ({
  getPredictionSection: mocks.section,
  getPorrasStats: mocks.stats,
}));
vi.mock('@/features/predictions/public', () => ({
  PredictionSectionScreen: () => null,
  PredictionsClient: () => null,
  MobilePredictionsScreen: () => null,
}));
vi.mock('@/lib/mobile/route-server', () => ({ requireMobileRoute: mocks.guard }));
vi.mock('@/lib/mobile/presentation-server', () => ({ isPhonePresentation: mocks.phone }));
vi.mock('@/components/ui', () => ({ PageHeader: () => null }));
import SectionPage from '@/app/(app)/predictions/[section]/page';
import Page, { revalidate } from '@/app/(app)/predictions/page';

beforeEach(() => vi.resetAllMocks());
it('guards sections before reading and preserves framework redirect/not-found errors', async () => {
  const error = new Error('framework route guard');
  mocks.guard.mockRejectedValue(error);
  await expect(SectionPage({ params: Promise.resolve({ section: 'invalid' }) })).rejects.toBe(
    error
  );
  expect(mocks.guard).toHaveBeenCalledWith('/predictions/invalid');
  expect(mocks.section).not.toHaveBeenCalled();
});
it('passes the existing section string and registry title to the feature screen', async () => {
  mocks.guard.mockResolvedValue({ definition: { title: 'Ranking' } });
  const model = { rows: [{ key: '7', title: 'Registro 1', href: '/user/7' }] };
  mocks.section.mockResolvedValue(model);
  const result = await SectionPage({ params: Promise.resolve({ section: 'ranking' }) });
  expect(mocks.section).toHaveBeenCalledWith('ranking');
  expect(result.props).toEqual({ title: 'Ranking', model });
});
it('keeps page freshness and reads statistics on the phone path', async () => {
  mocks.phone.mockResolvedValue(true);
  const stats = { table_stats: [] };
  mocks.stats.mockResolvedValue(stats);
  const result = await Page();
  expect(revalidate).toBe(300);
  expect(mocks.stats).toHaveBeenCalledOnce();
  expect(result.props).toEqual({ stats });
});
