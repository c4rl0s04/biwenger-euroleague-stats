import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { ModalDialog } from '../foundation';

describe('ModalDialog server contract', () => {
  it('retains content and an accessible name before hydration without accessing document', () => {
    const html = renderToStaticMarkup(
      <ModalDialog aria-label="Details" onClose={() => {}}>
        Visible content
      </ModalDialog>
    );
    expect(html).toContain('role="dialog"');
    expect(html).toContain('aria-modal="true"');
    expect(html).toContain('aria-label="Details"');
    expect(html).toContain('tabindex="-1"');
    expect(html).toContain('Visible content');
  });
  it('preserves section semantics and description relationships supplied by the owner', () => {
    const html = renderToStaticMarkup(
      <ModalDialog
        as="section"
        aria-labelledby="title"
        aria-describedby="description"
        onClose={() => {}}
      >
        <h2 id="title">Details</h2>
        <p id="description">Description</p>
      </ModalDialog>
    );
    expect(html).toMatch(/^<section/);
    expect(html).toContain('aria-labelledby="title"');
    expect(html).toContain('aria-describedby="description"');
  });
});
