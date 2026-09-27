import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button, EmptyState } from '../foundation';

describe('EmptyState', () => {
  it('renders supplied copy on the server without adding a surface or live announcement', () => {
    const html = renderToStaticMarkup(<EmptyState>No results</EmptyState>);
    expect(html).toContain('No results');
    expect(html).not.toMatch(/role=|aria-live=|<button|background/);
  });

  it('preserves escaped copy and composes an optional caller-owned action', () => {
    const html = renderToStaticMarkup(
      <EmptyState>
        <p>{'<missing>'}</p>
        <Button>Reset filters</Button>
      </EmptyState>
    );
    expect(html).toContain('&lt;missing&gt;');
    expect(html).toContain('Reset filters</button>');
  });

  it('forwards semantics and local spacing without owning domain data', () => {
    const html = renderToStaticMarkup(
      <EmptyState id="empty" role="status" className="py-14">
        Nothing here
      </EmptyState>
    );
    expect(html).toContain('id="empty"');
    expect(html).toContain('role="status"');
    expect(html).toContain('py-14');
  });
});
