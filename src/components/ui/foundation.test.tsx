import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';

import {
  Surface,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from './foundation';

const variants = [
  ['default', 'bg-[hsl(var(--surface-card))]'],
  ['raised', 'bg-popover'],
  ['subtle', 'bg-secondary'],
] as const;

describe('Surface', () => {
  it('renders children in a padding-free default surface without button semantics', () => {
    const html = renderToStaticMarkup(<Surface>Content</Surface>);
    expect(html).toContain('>Content</div>');
    expect(html).toContain('bg-[hsl(var(--surface-card))]');
    expect(html).toContain('rounded-[var(--radius-surface)]');
    expect(html).not.toMatch(/\b(?:p-\d|role=|tabindex=|hover:|focus-within:)/);
  });

  it.each(variants)('supports the %s semantic surface', (variant, background) => {
    expect(renderToStaticMarkup(<Surface variant={variant} />)).toContain(background);
  });

  it.each(variants)('keeps interaction orthogonal to %s hierarchy', (variant, background) => {
    const html = renderToStaticMarkup(<Surface variant={variant} interactive />);
    expect(html).toContain(background);
    expect(html).toContain('hover:border-primary/40!');
    expect(html).toContain('focus-within:border-ring!');
    expect(html).toContain('motion-reduce:transition-none');
    expect(html).not.toMatch(/role=|tabindex=|interactive=|variant=/);
  });

  it('merges consumer classes and forwards DOM props', () => {
    const html = renderToStaticMarkup(
      <Surface id="surface" aria-label="Summary" data-owner="example" className="border-0 custom" />
    );
    expect(html).toContain('id="surface"');
    expect(html).toContain('aria-label="Summary"');
    expect(html).toContain('data-owner="example"');
    expect(html).toContain('border-0 custom');
    expect(html.match(/class="([^"]*)"/)?.[1].split(' ')).not.toContain('border');
  });

  it('forwards browser event handlers without adding its own behavior', () => {
    const onClick = vi.fn();
    expect(Surface({ onClick }).props.onClick).toBe(onClick);
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe('Card', () => {
  it('composes Surface with comfortable spacing by default', () => {
    expect(Card({}).type).toBe(Surface);
    const html = renderToStaticMarkup(<Card>Body</Card>);
    expect(html).toContain('bg-[hsl(var(--surface-card))]');
    expect(html).toContain('gap-6 p-6');
    expect(html).toContain('>Body</div>');
    expect(html).not.toContain('hover:');
  });

  it('applies compact spacing without leaking density to the DOM', () => {
    const html = renderToStaticMarkup(<Card density="compact" />);
    expect(html).toContain('gap-4 p-4');
    expect(html).not.toMatch(/gap-6|p-6|density=/);
  });

  it.each(variants)('delegates %s surface and interaction to Surface', (variant, background) => {
    const html = renderToStaticMarkup(<Card variant={variant} interactive />);
    expect(html).toContain(background);
    expect(html).toContain('hover:border-primary/40!');
    expect(html).toContain('focus-within:border-ring!');
  });

  it('composes optional header slots and accessible title/description relationships', () => {
    const html = renderToStaticMarkup(
      <Card aria-labelledby="title" aria-describedby="description">
        <CardHeader
          icon={<svg aria-label="Category" />}
          eyebrow="Overview"
          action={<button type="button">Filter</button>}
        >
          <CardTitle id="title">Summary</CardTitle>
          <CardDescription id="description">Supporting copy</CardDescription>
        </CardHeader>
        <CardContent>
          <ul>
            <li>Arbitrary content</li>
          </ul>
        </CardContent>
        <CardFooter>
          <a href="/example">Details</a>
        </CardFooter>
      </Card>
    );
    expect(html).toContain('aria-labelledby="title" aria-describedby="description"');
    expect(html).toContain('<svg aria-label="Category">');
    expect(html).toContain('Overview');
    expect(html).toMatch(/<h3[^>]*id="title">Summary<\/h3>/);
    expect(html).toMatch(/<p[^>]*id="description">Supporting copy<\/p>/);
    expect(html).toContain('<button type="button">Filter</button>');
    expect(html).toContain('<ul><li>Arbitrary content</li></ul>');
    expect(html).toContain('<a href="/example">Details</a>');
    expect(html).not.toMatch(/(?:icon|eyebrow|action)=/);
  });

  it.each(['h2', 'h3', 'h4'] as const)('renders an explicit %s heading', (as) => {
    const html = renderToStaticMarkup(<CardTitle as={as}>Title</CardTitle>);
    expect(html).toMatch(new RegExp(`^<${as}[^>]*>Title</${as}>$`));
    expect(html).not.toContain('as=');
  });

  it('keeps nested card density independent', () => {
    const html = renderToStaticMarkup(
      <Card density="compact">
        <Card>Inner</Card>
      </Card>
    );
    expect(html).toMatch(/gap-4 p-4[^>]*><div[^>]*gap-6 p-6[^>]*>Inner/);
  });

  it('allows root spacing overrides and forwards DOM props and handlers', () => {
    const onClick = vi.fn();
    expect(Card({ onClick }).props.onClick).toBe(onClick);
    const html = renderToStaticMarkup(
      <Card id="card" data-owner="example" className="p-0 gap-2" />
    );
    expect(html).toContain('id="card"');
    expect(html).toContain('data-owner="example"');
    expect(html).toContain('p-0 gap-2');
    expect(html).not.toMatch(/p-6|gap-6/);
  });

  it.each([CardHeader, CardTitle, CardDescription, CardContent, CardFooter])(
    'keeps %s classes and DOM props extensible',
    (Component) => {
      const html = renderToStaticMarkup(
        <Component id="part" aria-label="Card part" data-owner="example" className="custom">
          Child
        </Component>
      );
      expect(html).toContain('custom');
      expect(html).toContain('id="part"');
      expect(html).toContain('aria-label="Card part"');
      expect(html).toContain('data-owner="example"');
      expect(html).toContain('Child');
    }
  );
});
