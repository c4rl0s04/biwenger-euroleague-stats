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
});
