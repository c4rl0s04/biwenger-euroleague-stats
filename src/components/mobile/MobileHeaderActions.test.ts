import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('mobile header actions', () => {
  it('uses phone-native sheets for both search and profile actions', () => {
    const source = readFileSync(new URL('./MobileHeaderActions.tsx', import.meta.url), 'utf8');

    expect(source).not.toContain('UserSelector');
    expect(source).toContain('aria-label="Abrir búsqueda"');
    expect(source).toContain('aria-label="Abrir perfil"');
    expect(source).toContain('title="Buscar"');
    expect(source).toContain('title="Cuenta"');
  });
});
