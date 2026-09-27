import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const modules = ['compositions/EmptyState.tsx', 'controls/ModalDialog.tsx'];
describe('Shared composition/control boundaries', () => {
  it.each(modules)('%s stays domain-independent and theme-agnostic', (file) => {
    const source = readFileSync(new URL(file, import.meta.url), 'utf8');
    expect(source).not.toMatch(/@\/(?:features|components\/shell|lib\/db)/);
    expect(source).not.toMatch(/CardThemeContext|useTheme|server-only|drizzle-orm|dark:|light:/);
  });
});
