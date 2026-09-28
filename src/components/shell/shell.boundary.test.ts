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

  it('keeps shell presentation on canonical semantic token names', () => {
    const shellFiles = files('src/components/shell').filter(
      (p) => !p.includes('.test.') && /\.(?:ts|tsx|js|jsx)$/.test(p)
    );
    const legacyUtility =
      /\b(?:bg-(?:background|card|popover|primary|secondary|muted|destructive|border)|text-(?:foreground|muted-foreground|secondary-foreground|primary|primary-foreground|destructive)|border-(?:border|primary|destructive)|ring-(?:border|primary)|(?:via|from|to)-primary)(?=\/|[\s"'\`])/;

    for (const file of shellFiles) {
      expect(read(file), `Legacy semantic utility found in ${file}`).not.toMatch(legacyUtility);
    }

    const globals = read('src/app/globals.css');
    for (const token of [
      '--color-surface-card:',
      '--color-content-primary:',
      '--color-content-muted:',
      '--color-action-primary:',
      '--color-border-default:',
      '--color-shell-surface:',
      '--color-shell-action-primary:',
    ]) {
      expect(globals).toContain(token);
    }

    const mobile = read('src/app/mobile-native.css');
    const headerChrome = mobile.slice(
      mobile.indexOf('.mobile-app {'),
      mobile.indexOf('.mobile-alert-list')
    );
    const sheetChrome = mobile.slice(
      mobile.indexOf('.mobile-native-sheet-layer {'),
      mobile.indexOf('.mobile-sticky-action-bar {')
    );
    const legacyCssVariable =
      /var\(--(?:background|card|primary|secondary|foreground|muted-foreground|border)\)/;

    expect(headerChrome).not.toMatch(legacyCssVariable);
    expect(sheetChrome).not.toMatch(legacyCssVariable);
    expect(sheetChrome).toContain('var(--shell-dialog-overlay)');
    expect(sheetChrome).toContain('var(--shell-dialog-shadow)');

    const semanticTokens = read('src/styles/tokens/semantic-tokens.css');
    expect(semanticTokens).toContain('--shell-dialog-overlay:');
    expect(semanticTokens).toContain('--shell-dialog-shadow:');
    expect(semanticTokens).toContain('--shell-command-overlay:');
    expect(semanticTokens).toContain('--shell-heading-content:');
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
