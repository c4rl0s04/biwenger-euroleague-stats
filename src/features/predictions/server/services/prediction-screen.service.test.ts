import { beforeEach, expect, it, vi } from 'vitest';
const read = vi.hoisted(() => vi.fn());
vi.mock('server-only', () => ({}));
vi.mock('./predictions-read.service', () => ({ getPorrasStats: read }));
import { getPredictionSection } from './prediction-screen.service';
beforeEach(() => vi.resetAllMocks());

it('projects each request separately without introducing memoization', async () => {
  read.mockResolvedValue({ table_stats: [{ user_id: 7, usuario: 'Manager' }] });
  const first = await getPredictionSection('ranking');
  const second = await getPredictionSection('ranking');
  expect(read).toHaveBeenCalledTimes(2);
  expect(first).toEqual({ rows: [{ key: '7', title: 'Registro 1', href: '/user/7' }] });
  expect(second).toEqual(first);
  expect(second).not.toBe(first);
});

it('preserves read failures rather than replacing them with an empty success', async () => {
  const failure = new Error('fixture read unavailable');
  read.mockRejectedValue(failure);
  await expect(getPredictionSection('history')).rejects.toBe(failure);
});
