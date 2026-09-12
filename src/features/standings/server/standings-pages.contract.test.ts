import { beforeEach, expect, it, vi } from 'vitest';
import ts from 'typescript';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as jsxRuntime from 'react/jsx-runtime';
import type { ReactElement } from 'react';
type PageModule = {
  dynamic?: string;
  default: (props?: {
    params: Promise<{ section: string }>;
  }) => Promise<ReactElement<{ data: unknown }>>;
};
function loadPage(path: string): PageModule {
  const source = readFileSync(resolve(process.cwd(), path), 'utf8');
  const js = ts.transpileModule(source, {
    fileName: 'page.tsx',
    compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
  }).outputText;
  const compiled = { exports: {} };
  const dependencies: Record<string, unknown> = {
    'react/jsx-runtime': jsxRuntime,
    '@/lib/mobile/presentation-server': { isPhonePresentation: mocks.phone },
    '@/lib/mobile/route-server': { requireMobileRoute: mocks.guard },
    '@/features/standings/server': {
      getStandingsOverview: mocks.overview,
      getStandingsSection: mocks.section,
    },
    '@/features/standings/public': {
      DesktopStandingsScreen: 'desktop',
      MobileStandingsScreen: 'mobile',
      StandingsSectionScreen: 'section',
    },
  };
  new Function('require', 'module', 'exports', js)(
    (name: string) => {
      if (!(name in dependencies)) throw new Error('Unexpected page dependency: ' + name);
      return dependencies[name];
    },
    compiled,
    compiled.exports
  );
  return compiled.exports as PageModule;
}
const { default: OverviewPage, dynamic } = loadPage('src/app/(app)/standings/page.js');
const { default: SectionPage } = loadPage('src/app/(app)/standings/[section]/page.tsx');

const mocks = vi.hoisted(() => ({
  phone: vi.fn(),
  guard: vi.fn(),
  overview: vi.fn(),
  section: vi.fn(),
}));
vi.mock('@/lib/mobile/presentation-server', () => ({ isPhonePresentation: mocks.phone }));
vi.mock('@/lib/mobile/route-server', () => ({ requireMobileRoute: mocks.guard }));
vi.mock('@/features/standings/server', () => ({
  getStandingsOverview: mocks.overview,
  getStandingsSection: mocks.section,
}));
vi.mock('@/features/standings/public', () => ({
  DesktopStandingsScreen: 'desktop',
  MobileStandingsScreen: 'mobile',
  StandingsSectionScreen: 'section',
}));

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
  mocks.guard.mockResolvedValue({ definition: { title: 'Draft' } });
});

it('desktop overview stays dynamic and performs no phone read', async () => {
  mocks.phone.mockResolvedValue(false);
  expect(dynamic).toBe('force-dynamic');
  expect((await OverviewPage()).type).toBe('desktop');
  expect(mocks.overview).not.toHaveBeenCalled();
});

it('phone overview passes the service model', async () => {
  mocks.phone.mockResolvedValue(true);
  const model = { standings: [], leagueTotals: {} };
  mocks.overview.mockResolvedValue(model);
  expect((await OverviewPage()).props.data).toBe(model);
});

it('runs section guard before service and passes its title', async () => {
  const model = { rows: [] };
  mocks.section.mockResolvedValue(model);
  const page = await SectionPage({ params: Promise.resolve({ section: 'draft' }) });
  expect(mocks.guard).toHaveBeenCalledWith('/standings/draft');
  expect(mocks.guard.mock.invocationCallOrder[0]).toBeLessThan(
    mocks.section.mock.invocationCallOrder[0]
  );
  expect(page.props).toEqual({ section: 'draft', title: 'Draft', data: model });
});

it.each(['desktop redirect', 'not found', 'authentication redirect'])(
  'does not read past %s',
  async (message) => {
    const error = new Error(message);
    mocks.guard.mockRejectedValue(error);
    await expect(SectionPage({ params: Promise.resolve({ section: 'bad' }) })).rejects.toBe(error);
    expect(mocks.section).not.toHaveBeenCalled();
  }
);
