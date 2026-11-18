import { beforeEach, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  login: vi.fn(),
  account: vi.fn(),
  compare: vi.fn(),
  linked: vi.fn(),
  config: null as unknown as {
    providers: {
      authorize: (credentials: { name?: unknown; password?: unknown }) => Promise<unknown>;
    }[];
    callbacks: {
      jwt: (input: {
        token: { id: string; email: string; biwengerLinked: boolean };
        trigger?: string;
        session?: { email: string; biwengerLinked: boolean };
      }) => Promise<unknown>;
    };
    session: { strategy: string };
  },
}));
vi.unmock('@/auth');
vi.mock('next-auth', () => ({
  default: (config: unknown) => {
    mocks.config = config as typeof mocks.config;
    return { auth: vi.fn(), handlers: {}, signIn: vi.fn(), signOut: vi.fn() };
  },
}));
vi.mock('next-auth/providers/credentials', () => ({ default: (options: unknown) => options }));
vi.mock('bcryptjs', () => ({ default: { compare: mocks.compare } }));
vi.mock('@/lib/auth/repository', () => ({
  findLoginAccount: mocks.login,
  findSessionAccount: mocks.account,
}));
vi.mock('@/lib/credentials/server', () => ({
  biwengerCredentials: { hasCredential: mocks.linked },
}));
import '@/auth';

beforeEach(() => {
  vi.clearAllMocks();
  mocks.login.mockResolvedValue({
    id: '1',
    name: 'fixture',
    email: 'fixture@example.test',
    password: 'hash',
  });
  mocks.compare.mockResolvedValue(true);
  mocks.linked.mockResolvedValue(true);
});
it('preserves credential rejection and returns only safe identity on successful login', async () => {
  const authorize = mocks.config.providers[0].authorize;
  expect(await authorize({ name: 'fixture' })).toBeNull();
  expect(mocks.login).not.toHaveBeenCalled();
  expect(await authorize({ name: 'fixture', password: 'input' })).toEqual({
    id: '1',
    name: 'fixture',
    email: 'fixture@example.test',
    image: null,
    biwengerLinked: true,
  });
  expect(mocks.compare).toHaveBeenCalledWith('input', 'hash');
  mocks.compare.mockResolvedValue(false);
  expect(await authorize({ name: 'fixture', password: 'bad' })).toBeNull();
  mocks.login.mockResolvedValue(undefined);
  mocks.compare.mockResolvedValue(true);
  expect(await authorize({ name: 'missing', password: 'input' })).toBeNull();
  expect(mocks.compare).toHaveBeenLastCalledWith('input', expect.stringMatching(/^\$2[aby]\$10\$/));
  mocks.login.mockResolvedValue({ id: '1', password: null });
  expect(await authorize({ name: 'fixture', password: 'input' })).toBeNull();
  expect(mocks.compare).toHaveBeenLastCalledWith('input', expect.stringMatching(/^\$2[aby]\$10\$/));
});
it('rejects malformed and oversized credentials before database or bcrypt work', async () => {
  const authorize = mocks.config.providers[0].authorize;
  for (const credentials of [
    { name: 42, password: 'input' },
    { name: 'fixture', password: ['input'] },
    { name: 'a'.repeat(257), password: 'input' },
    { name: 'fixture', password: 'a'.repeat(1025) },
  ]) {
    expect(await authorize(credentials)).toBeNull();
  }
  expect(mocks.login).not.toHaveBeenCalled();
  expect(mocks.compare).not.toHaveBeenCalled();
});

it('keeps account lookup failures out of logs and sign-in responses', async () => {
  const errorLog = vi.spyOn(console, 'error').mockImplementation(() => {});
  try {
    mocks.login.mockRejectedValueOnce(new Error('query failed for fixture'));
    expect(
      await mocks.config.providers[0].authorize({ name: 'fixture', password: 'input' })
    ).toBeNull();
    expect(errorLog).toHaveBeenCalledExactlyOnceWith('Credential sign-in unavailable');
  } finally {
    errorLog.mockRestore();
  }
});

it('refreshes JWT state from storage and ignores client update fields', async () => {
  mocks.account.mockResolvedValue({ email: 'stored@example.test' });
  const result = await mocks.config.callbacks.jwt({
    token: { id: '1', email: 'old', biwengerLinked: false },
    trigger: 'update',
    session: { email: 'attacker', biwengerLinked: false },
  });
  expect(result).toMatchObject({ id: '1', email: 'stored@example.test', biwengerLinked: true });
  expect(mocks.account).toHaveBeenCalledWith('1');
  expect(mocks.config.session).toEqual({ strategy: 'jwt' });
});
it('retains existing safe state when refresh fails and does not refresh complete tokens unnecessarily', async () => {
  const token = { id: '1', email: 'old', biwengerLinked: false };
  expect(await mocks.config.callbacks.jwt({ token })).toMatchObject(token);
  expect(mocks.account).not.toHaveBeenCalled();
  mocks.account.mockRejectedValue(new Error('database unavailable'));
  expect(await mocks.config.callbacks.jwt({ token, trigger: 'update' })).toMatchObject(token);
});
