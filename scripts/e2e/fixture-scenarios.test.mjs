import { expect, it } from 'vitest';
import { parseFixtureArgs } from './fixture-scenarios.mjs';
import { marketFixtureStatements } from './market-fixture.mjs';

it('leaves the default suite and every Playwright argument unchanged', () => {
  const args = ['tests/e2e/market.spec.ts', '--project=iphone-13', '--repeat-each=3'];
  expect(parseFixtureArgs(args)).toEqual({ fixture: 'default', playwrightArgs: args });
  expect(args).toHaveLength(3);
});

it('accepts only a fixed opt-in Market fixture without forwarding the selector to Playwright', () => {
  expect(parseFixtureArgs(['--fixture=market', '--project=iphone-13'])).toEqual({
    fixture: 'market',
    playwrightArgs: ['--project=iphone-13'],
  });
});

it.each([
  ['--fixture=production'],
  ['--fixture=../../custom'],
  ['--fixture='],
  ['--fixture=market', '--fixture=market'],
  ['--fixture', 'market'],
])('rejects ambiguous or unknown fixture selectors %j', (...args) => {
  expect(() => parseFixtureArgs(args)).toThrow();
});

it('keeps synthetic historical facts independent of wall-clock dates and production operations', () => {
  expect(marketFixtureStatements).toHaveLength(7);
  for (const [sql] of marketFixtureStatements) {
    expect(sql).toMatch(/^(INSERT INTO|UPDATE) /);
    expect(sql).not.toMatch(/\b(DROP|DELETE|TRUNCATE|ALTER|NOW|CURRENT_DATE)\b/i);
    expect(sql).not.toMatch(/password|token|credential|auth_secret/i);
  }
});
