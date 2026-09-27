import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(p, 'utf8');
const files = (p: string): string[] =>
  readdirSync(p, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory() ? files(join(p, e.name)) : [join(p, e.name)]
  );

describe('Application shell architecture boundary', () => {
  it('keeps shell strictly presentation and client-safe (no direct db or server internals)', () => {
    const shellFiles = files('src/components/shell').filter((p) => !p.includes('.test.'));
    expect(shellFiles.length).toBeGreaterThan(10);

    for (const file of shellFiles) {
      const content = read(file);
      expect(content).not.toMatch(/@\/lib\/db|drizzle-orm|import\s+['"]server-only['"]/);
      expect(content).not.toMatch(/@\/components\/layout\/(?!Section)/);
      expect(content).not.toMatch(/@\/components\/user/);
    }
  });

  it('verifies obsolete legacy layout components have been completely deleted', () => {
    const obsoleteFiles = [
      'src/components/layout/AppShell.js',
      'src/components/layout/TopHeader.js',
      'src/components/layout/Sidebar.js',
      'src/components/layout/MobileNavigation.js',
      'src/components/layout/NavigationFeedback.js',
      'src/components/layout/navigation.js',
      'src/components/layout/navigation.test.ts',
      'src/components/layout/SearchDropdown.js',
      'src/components/layout/SeasonSelector.js',
      'src/components/layout/SettingsDropdown.js',
      'src/components/layout/Navbar.js',
      'src/components/layout/ClientWrapper.js',
      'src/components/layout/SectionContext.js',
      'src/components/user/UserSelector.js',
      'src/components/user/index.js',
      'src/components/ui/CommandPalette.js',
    ];

    for (const file of obsoleteFiles) {
      expect(existsSync(file), `Expected ${file} to be deleted`).toBe(false);
    }
  });

  it('retires dead barrels and keeps the live Section compatibility composition explicit', () => {
    expect(existsSync('src/components/index.js')).toBe(false);
    expect(existsSync('src/components/layout/index.js')).toBe(false);
    expect(existsSync('src/lib/services/app/appShellService.ts')).toBe(false);
    expect(read('src/components/layout/Section.js')).toContain(
      '@/components/shell/shared/SectionContext'
    );
    expect(read('src/app/(app)/layout.js')).toContain('@/lib/seasons/server');
  });

  it('wires root app layout to shell components', () => {
    const layout = read('src/app/(app)/layout.js');
    expect(layout).toContain("import { AppShell } from '@/components/shell/AppShell';");
    expect(layout).toContain(
      "import { AppProviders } from '@/components/shell/shared/AppProviders';"
    );
    expect(layout).toContain(
      "import { SectionProvider } from '@/components/shell/shared/SectionContext';"
    );
    expect(layout).not.toContain('@/components/layout/AppShell');
    expect(layout).not.toContain('@/components/layout/ClientWrapper');
  });
});
