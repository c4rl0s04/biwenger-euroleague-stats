import { readFileSync } from 'node:fs';
import { renderToStaticMarkup } from 'react-dom/server';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const portal = vi.hoisted(() => ({
  createPortal: vi.fn((content) => content),
}));

vi.mock('react-dom', () => ({
  createPortal: portal.createPortal,
}));

import MobileBottomSheet from './MobileBottomSheet';

describe('MobileBottomSheet', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'document', {
      configurable: true,
      value: { body: {} },
    });
  });

  afterEach(() => {
    portal.createPortal.mockClear();
    Reflect.deleteProperty(globalThis, 'document');
  });

  it('portals an open sheet to the document body so sticky headers cannot trap it', () => {
    const html = renderToStaticMarkup(
      <MobileBottomSheet open onClose={() => {}} title="Buscar">
        Contenido
      </MobileBottomSheet>
    );

    expect(html).toContain('role="dialog"');
    expect(portal.createPortal).toHaveBeenCalledWith(expect.anything(), document.body);
  });

  it('marks the dedicated search variant for bounded viewport layout', () => {
    const html = renderToStaticMarkup(
      <MobileBottomSheet open onClose={() => {}} title="Buscar" variant="search">
        Contenido
      </MobileBottomSheet>
    );

    expect(html).toContain('mobile-native-sheet-search');
    expect(html).toContain('mobile-native-sheet-body-search');
  });

  it('uses the visual viewport only to calculate keyboard overlap', () => {
    const source = readFileSync(new URL('./MobileBottomSheet.tsx', import.meta.url), 'utf8');

    expect(source).toContain('window.visualViewport');
    expect(source).toContain('syncKeyboardInset');
    expect(source).toContain('--mobile-keyboard-inset');
    expect(source).not.toContain("bottom: 'auto'");
    expect(source).toContain("preventInitialFocusScroll={variant === 'search'}");
  });
});
