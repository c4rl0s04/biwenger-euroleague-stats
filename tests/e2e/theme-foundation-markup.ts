// Executed through tsx: Playwright's JSX transform produces component-protocol objects.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Surface,
  Button,
  IconButton,
  Badge,
  Avatar,
  Input,
  Skeleton,
} from '../../src/components/ui/foundation';

const markup = renderToStaticMarkup(
  createElement(
    Card,
    { id: 'theme-card', interactive: true },
    createElement(CardTitle, null, 'Semantic foundation'),
    createElement(CardDescription, null, 'Readable supporting text on a distinct surface.'),
    createElement(Surface, { variant: 'raised', id: 'theme-raised' }, 'Raised surface'),
    createElement(Surface, { variant: 'subtle', id: 'theme-subtle' }, 'Subtle surface'),
    createElement('button', { type: 'button', id: 'theme-focus' }, 'Focus target'),
    createElement(
      CardContent,
      { className: 'flex flex-col gap-4' },
      createElement(
        'div',
        { className: 'flex flex-wrap items-center gap-3', id: 'theme-buttons' },
        createElement(Button, { id: 'theme-btn-primary', variant: 'primary' }, 'Primary Action'),
        createElement(
          Button,
          { id: 'theme-btn-secondary', variant: 'secondary' },
          'Secondary Action'
        ),
        createElement(Button, { id: 'theme-btn-ghost', variant: 'ghost' }, 'Ghost Action'),
        createElement(
          IconButton,
          { id: 'theme-icon-btn', 'aria-label': 'Settings', variant: 'secondary' },
          createElement('span', null, '⚙')
        )
      ),
      createElement(
        'div',
        { className: 'flex flex-wrap items-center gap-2', id: 'theme-badges' },
        createElement(Badge, { id: 'theme-badge-neutral', variant: 'neutral' }, 'Neutral'),
        createElement(Badge, { id: 'theme-badge-accent', variant: 'accent' }, 'Accent'),
        createElement(Badge, { id: 'theme-badge-danger', variant: 'danger' }, 'Danger')
      ),
      createElement(
        'div',
        { className: 'flex items-center gap-3', id: 'theme-avatars' },
        createElement(Avatar, {
          id: 'theme-avatar-fallback',
          fallback: 'BS',
          alt: 'Biwenger Stats',
          size: 'md',
        }),
        createElement(Avatar, {
          id: 'theme-avatar-img',
          src: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg"/>',
          alt: 'Biwenger Avatar',
          size: 'md',
        })
      ),
      createElement(
        'div',
        { className: 'flex flex-col gap-2', id: 'theme-inputs' },
        createElement(Input, { id: 'theme-input-normal', placeholder: 'Enter player name...' }),
        createElement(Input, {
          id: 'theme-input-invalid',
          'aria-invalid': true,
          defaultValue: 'Invalid input',
        }),
        createElement(Input, {
          id: 'theme-input-disabled',
          disabled: true,
          value: 'Disabled value',
        })
      ),
      createElement(Skeleton, { id: 'theme-skeleton', className: 'h-6 w-48' })
    ),
    createElement(CardFooter, null, 'Footer content')
  )
);

process.stdout.write(markup);
