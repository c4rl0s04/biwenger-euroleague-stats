import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
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
  Button,
  IconButton,
  Badge,
  Avatar,
  Input,
  Skeleton,
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

describe('Button', () => {
  it('renders a button element with default type="button", variant="primary", and size="md"', () => {
    const html = renderToStaticMarkup(<Button>Action</Button>);
    expect(html).toContain('<button');
    expect(html).toContain('type="button"');
    expect(html).toContain('bg-[hsl(var(--action-primary))]');
    expect(html).toContain('text-[hsl(var(--action-primary-content))]');
    expect(html).toContain('h-11 px-4');
    expect(html).toContain('rounded-[var(--radius-control)]');
    expect(html).toContain('>Action</button>');
  });

  it('preserves explicit type="submit"', () => {
    const html = renderToStaticMarkup(<Button type="submit">Submit</Button>);
    expect(html).toContain('type="submit"');
    expect(html).not.toContain('type="button"');
  });

  it.each([
    ['primary', 'bg-[hsl(var(--action-primary))]', 'text-[hsl(var(--action-primary-content))]'],
    ['secondary', 'bg-[hsl(var(--surface-secondary))]', 'text-foreground'],
    ['ghost', 'bg-transparent', 'text-muted-foreground'],
  ] as const)('renders %s variant styling', (variant, bg, text) => {
    const html = renderToStaticMarkup(<Button variant={variant}>Label</Button>);
    expect(html).toContain(bg);
    expect(html).toContain(text);
  });

  it.each([
    ['sm', 'h-8 px-3 text-xs'],
    ['md', 'h-11 px-4 text-sm'],
    ['lg', 'h-12 px-6 text-base'],
  ] as const)('renders %s size styling', (size, classes) => {
    const html = renderToStaticMarkup(<Button size={size}>Label</Button>);
    expect(html).toContain(classes);
  });

  it('supports disabled state and prevents interactions', () => {
    const html = renderToStaticMarkup(<Button disabled>Disabled</Button>);
    expect(html).toContain('disabled=""');
    expect(html).toContain('disabled:pointer-events-none');
    expect(html).toContain('disabled:opacity-50');
  });

  it('passes through native DOM attributes and merges custom className', () => {
    const html = renderToStaticMarkup(
      <Button id="btn-1" name="action-btn" data-custom="value" className="my-custom-class">
        Custom
      </Button>
    );
    expect(html).toContain('id="btn-1"');
    expect(html).toContain('name="action-btn"');
    expect(html).toContain('data-custom="value"');
    expect(html).toContain('my-custom-class');
  });

  it('forwards ref to the underlying button element', () => {
    const ref = { current: null };
    // @ts-expect-error accessing forwardRef render implementation in test
    const element = Button.render({ children: 'Ref test' }, ref);
    expect(element.type).toBe('button');
    expect(element.props.ref).toBe(ref);
  });

  it('composes icons and children cleanly', () => {
    const html = renderToStaticMarkup(
      <Button>
        <span data-testid="icon">Icon</span>
        Save
      </Button>
    );
    expect(html).toContain('data-testid="icon"');
    expect(html).toContain('Save');
    expect(html).toContain('gap-2');
  });
});

describe('IconButton', () => {
  it('renders a square button with default variant="secondary", size="md", and type="button"', () => {
    const html = renderToStaticMarkup(
      <IconButton aria-label="Close">
        <span>X</span>
      </IconButton>
    );
    expect(html).toContain('<button');
    expect(html).toContain('type="button"');
    expect(html).toContain('aria-label="Close"');
    expect(html).toContain('h-11 w-11 p-0');
    expect(html).toContain('bg-[hsl(var(--surface-secondary))]');
    expect(html).toContain('rounded-[var(--radius-control)]');
    expect(html).toContain('shrink-0');
  });

  it.each([
    ['sm', 'h-8 w-8 p-0'],
    ['md', 'h-11 w-11 p-0'],
    ['lg', 'h-12 w-12 p-0'],
  ] as const)('renders square dimensions for %s size', (size, classes) => {
    const html = renderToStaticMarkup(
      <IconButton size={size} aria-label="Action">
        <span>A</span>
      </IconButton>
    );
    expect(html).toContain(classes);
  });

  it.each(['primary', 'secondary', 'ghost'] as const)('supports %s variant', (variant) => {
    const html = renderToStaticMarkup(
      <IconButton variant={variant} aria-label="Action">
        <span>A</span>
      </IconButton>
    );
    if (variant === 'primary') expect(html).toContain('bg-[hsl(var(--action-primary))]');
    if (variant === 'secondary') expect(html).toContain('bg-[hsl(var(--surface-secondary))]');
    if (variant === 'ghost') expect(html).toContain('bg-transparent');
  });

  it('preserves accessible name via aria-labelledby', () => {
    const html = renderToStaticMarkup(
      <IconButton aria-labelledby="label-id">
        <span>+</span>
      </IconButton>
    );
    expect(html).toContain('aria-labelledby="label-id"');
  });

  it('warns in development when rendered without accessible name', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    renderToStaticMarkup(
      // @ts-expect-error testing missing accessible label
      <IconButton>
        <span>+</span>
      </IconButton>
    );
    expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Missing accessible name'));
    warnSpy.mockRestore();
  });

  it('forwards ref to the underlying button element', () => {
    const ref = { current: null };
    // @ts-expect-error accessing forwardRef render implementation in test
    const element = IconButton.render({ 'aria-label': 'Test', children: '+' }, ref);
    expect(element.type).toBe('button');
    expect(element.props.ref).toBe(ref);
  });

  it('passes through disabled and other native attributes', () => {
    const html = renderToStaticMarkup(
      <IconButton disabled aria-label="Disabled" id="icon-btn">
        <span>D</span>
      </IconButton>
    );
    expect(html).toContain('disabled=""');
    expect(html).toContain('id="icon-btn"');
  });
});

describe('Input', () => {
  it('renders native input with canonical height and control styling', () => {
    const html = renderToStaticMarkup(<Input placeholder="Search..." />);
    expect(html).toContain('<input');
    expect(html).toContain('type="text"');
    expect(html).toContain('placeholder="Search..."');
    expect(html).toContain('h-11');
    expect(html).toContain('rounded-[var(--radius-control)]');
    expect(html).toContain('bg-[hsl(var(--control-surface))]');
    expect(html).toContain('text-[hsl(var(--control-content))]');
    expect(html).toContain('border-[hsl(var(--control-border))]');
    expect(html).toContain('focus-visible:ring-[hsl(var(--focus-ring))]');
  });

  it('forwards native attributes including type, name, value, and disabled', () => {
    const html = renderToStaticMarkup(
      <Input
        type="email"
        name="email"
        defaultValue="user@example.com"
        disabled
        required
        autoComplete="email"
      />
    );
    expect(html).toContain('type="email"');
    expect(html).toContain('name="email"');
    expect(html).toContain('value="user@example.com"');
    expect(html).toContain('disabled=""');
    expect(html).toContain('required=""');
    expect(html).toContain('autoComplete="email"');
  });

  it('applies danger border and ring when aria-invalid is true', () => {
    const html = renderToStaticMarkup(<Input aria-invalid={true} />);
    expect(html).toContain('aria-invalid="true"');
    expect(html).toContain('aria-invalid:border-[hsl(var(--status-danger))]');
    expect(html).toContain('aria-invalid:focus-visible:ring-[hsl(var(--status-danger))]');
  });

  it('merges custom className without losing base control styles', () => {
    const html = renderToStaticMarkup(<Input className="w-64 custom-input" />);
    expect(html).toContain('custom-input');
    expect(html).toContain('h-11');
  });

  it('forwards ref to the underlying input element', () => {
    const ref = { current: null };
    // @ts-expect-error accessing forwardRef render implementation in test
    const element = Input.render({ placeholder: 'Ref test' }, ref);
    expect(element.type).toBe('input');
    expect(element.props.ref).toBe(ref);
  });
});

describe('Badge', () => {
  it('renders a neutral badge by default', () => {
    const html = renderToStaticMarkup(<Badge>Round 1</Badge>);
    expect(html).toContain('<span');
    expect(html).toContain('>Round 1</span>');
    expect(html).toContain('bg-[hsl(var(--surface-secondary))]');
    expect(html).toContain('text-foreground');
    expect(html).toContain('rounded-full');
  });

  it.each([
    ['neutral', 'bg-[hsl(var(--surface-secondary))]'],
    ['accent', 'bg-[hsl(var(--action-primary)/0.15)]'],
    ['danger', 'bg-[hsl(var(--status-danger)/0.15)]'],
  ] as const)('supports %s variant', (variant, bgClass) => {
    const html = renderToStaticMarkup(<Badge variant={variant}>Status</Badge>);
    expect(html).toContain(bgClass);
  });

  it('merges custom className and DOM props', () => {
    const html = renderToStaticMarkup(
      <Badge id="badge-1" data-info="test" className="tracking-wide">
        Tag
      </Badge>
    );
    expect(html).toContain('id="badge-1"');
    expect(html).toContain('data-info="test"');
    expect(html).toContain('tracking-wide');
  });
});

describe('Avatar', () => {
  it('renders an image when src is provided', () => {
    const html = renderToStaticMarkup(
      <Avatar src="https://example.com/photo.jpg" alt="Kendrick Nunn" size="md" />
    );
    expect(html).toContain('<span');
    expect(html).toContain('h-10 w-10');
    expect(html).toContain('rounded-full');
    expect(html).toContain('<img');
    expect(html).toContain('src="https://example.com/photo.jpg"');
    expect(html).toContain('alt="Kendrick Nunn"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
  });

  it('renders fallback when src is omitted or null', () => {
    const html = renderToStaticMarkup(<Avatar alt="Kendrick Nunn" fallback="KN" size="md" />);
    expect(html).toContain('<span');
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="Kendrick Nunn"');
    expect(html).toContain('>KN</span>');
    expect(html).not.toContain('<img');
  });

  it.each([
    ['sm', 'h-8 w-8 text-xs'],
    ['md', 'h-10 w-10 text-sm'],
    ['lg', 'h-12 w-12 text-base'],
  ] as const)('applies %s size classes', (size, classes) => {
    const html = renderToStaticMarkup(<Avatar fallback="T" size={size} />);
    expect(html).toContain(classes);
  });

  it('merges custom className and DOM props', () => {
    const html = renderToStaticMarkup(
      <Avatar fallback="X" id="avatar-1" className="ring-2 ring-orange-500" />
    );
    expect(html).toContain('id="avatar-1"');
    expect(html).toContain('ring-2 ring-orange-500');
  });
});

describe('Skeleton', () => {
  it('renders a placeholder with default aria-hidden="true" and animation', () => {
    const html = renderToStaticMarkup(<Skeleton className="h-6 w-32" />);
    expect(html).toContain('<div');
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('animate-pulse');
    expect(html).toContain('motion-reduce:animate-none');
    expect(html).toContain('rounded-[var(--radius-control)]');
    expect(html).toContain('bg-[hsl(var(--surface-secondary))]');
    expect(html).toContain('h-6 w-32');
  });

  it('allows overriding aria attributes and merging props', () => {
    const html = renderToStaticMarkup(
      <Skeleton role="status" aria-label="Loading..." id="skel-1" />
    );
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Loading..."');
    expect(html).toContain('id="skel-1"');
  });
});

describe('Foundation architectural boundaries', () => {
  it('exports all eight public foundation components from foundation.ts', () => {
    expect(Surface).toBeDefined();
    expect(Card).toBeDefined();
    expect(Button).toBeDefined();
    expect(IconButton).toBeDefined();
    expect(Badge).toBeDefined();
    expect(Avatar).toBeDefined();
    expect(Input).toBeDefined();
    expect(Skeleton).toBeDefined();
  });

  it('ensures no primitive imports theme context, hooks, or domain code', () => {
    const primitivesDir = path.resolve(__dirname, 'primitives');
    const files = readdirSync(primitivesDir).filter((f) => f.endsWith('.ts') || f.endsWith('.tsx'));
    expect(files.length).toBeGreaterThanOrEqual(7);

    for (const file of files) {
      const content = readFileSync(path.join(primitivesDir, file), 'utf8');
      expect(content, `${file} should not import ThemeContext`).not.toMatch(
        /from\s+['"].*ThemeContext['"]/
      );
      expect(content, `${file} should not import useTheme`).not.toMatch(/\buseTheme\b/);
      expect(content, `${file} should not import ResolvedTheme`).not.toMatch(/\bResolvedTheme\b/);
      expect(content, `${file} should not import features/domain`).not.toMatch(
        /from\s+['"]@\/features\//
      );
      expect(content, `${file} should not use 'use client'`).not.toContain("'use client'");
      expect(content, `${file} should not use "use client"`).not.toContain('"use client"');
    }
  });
});
