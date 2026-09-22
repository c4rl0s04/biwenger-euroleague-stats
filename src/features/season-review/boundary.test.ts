import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(p, 'utf8');
const files = (p: string): string[] =>
  readdirSync(p, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(p, e.name)) : [join(p, e.name)]
  );

describe('Season Review feature boundary', () => {
  it('enforces server-only contracts on server entrypoints and services', () => {
    expect(read('src/features/season-review/server.ts')).toMatch(/^import 'server-only'/);

    for (const p of files('src/features/season-review/server/services').filter(
      (f) => !f.includes('.test.')
    )) {
      expect(read(p)).toMatch(/^import 'server-only'/);
    }

    for (const p of files('src/features/season-review/server/queries').filter(
      (f) => !f.includes('.test.')
    )) {
      expect(read(p)).toMatch(/^import 'server-only'/);
    }
  });

  it('keeps public.ts, models, and screens completely client-safe without server or db dependencies', () => {
    const publicSource = read('src/features/season-review/public.ts');
    expect(publicSource).not.toMatch(/\/server|pgClient|@\/lib\/db|fs/);

    for (const p of files('src/features/season-review/models').filter(
      (f) => !f.includes('.test.')
    )) {
      const source = read(p);
      expect(source).not.toMatch(/server-only|pgClient|@\/lib\/db|node:fs|from 'fs'/);
    }

    for (const p of files('src/features/season-review/screens').filter(
      (f) => !f.includes('.test.')
    )) {
      const source = read(p);
      expect(source).not.toMatch(/server-only|pgClient|@\/lib\/db|node:fs|from 'fs'/);
    }
  });

  it('ensures no untyped any or Record<string, any> in feature contracts', () => {
    const serverSource = read('src/features/season-review/server.ts');
    const publicSource = read('src/features/season-review/public.ts');

    expect(serverSource).not.toMatch(/Record<string, any>|:\s*any\b/);
    expect(publicSource).not.toMatch(/Record<string, any>|:\s*any\b/);
  });

  it('ensures season review pages consume feature contracts and not legacy components', () => {
    const mainPage = read('src/app/(app)/season-review/page.tsx');
    expect(mainPage).toContain('@/features/season-review/public');
    expect(mainPage).toContain('@/features/season-review/server');
    expect(mainPage).not.toContain('@/components/season-review/');
    expect(mainPage).not.toContain('@/components/mobile/screens/MobileSeasonReview');

    const sectionPage = read('src/app/(app)/season-review/[section]/page.tsx');
    expect(sectionPage).toContain('@/features/season-review/public');
    expect(sectionPage).toContain('@/features/season-review/server');
    expect(sectionPage).not.toContain('@/components/mobile/screens/MobileSeasonReview');
  });

  it('verifies architecture policy registration and exceptions', () => {
    const policy = JSON.parse(read('scripts/architecture/policy.json'));
    expect(policy.entrypoints).toContain('src/app/(app)/season-review/page.tsx');
    expect(policy.entrypoints).toContain('src/app/(app)/season-review/[section]/page.tsx');

    const exceptions = policy.exceptions.filter((e: { edge: string }) =>
      e.edge.includes('src/app/(app)/season-review/page.tsx')
    );
    expect(exceptions).toHaveLength(6);
    for (const exp of exceptions) {
      expect(exp.edge).toMatch(/-> (src\/auth.js|src\/lib\/credentials\/repository.ts) ->/);
    }
  });

  it('provides thin backward compatibility shims', () => {
    const clientShim = read('src/components/season-review/SeasonReviewClient.tsx');
    expect(clientShim).toContain('@/features/season-review/public');

    const mobileScreenShim = read('src/components/mobile/screens/MobileSeasonReviewScreen.tsx');
    expect(mobileScreenShim).toContain('@/features/season-review/public');

    const mobileDetailShim = read('src/components/mobile/screens/MobileSeasonReviewDetail.tsx');
    expect(mobileDetailShim).toContain('@/features/season-review/public');
  });
});
