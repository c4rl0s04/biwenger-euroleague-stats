// Executed through tsx: Playwright's JSX transform produces component-protocol objects.
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Card, CardTitle, CardDescription, Surface } from '../../src/components/ui/foundation';

const markup = renderToStaticMarkup(
  createElement(
    Card,
    { id: 'theme-card', interactive: true },
    createElement(CardTitle, null, 'Semantic foundation'),
    createElement(CardDescription, null, 'Readable supporting text on a distinct surface.'),
    createElement(Surface, { variant: 'raised', id: 'theme-raised' }, 'Raised surface'),
    createElement(Surface, { variant: 'subtle', id: 'theme-subtle' }, 'Subtle surface'),
    createElement('button', { type: 'button', id: 'theme-focus' }, 'Focus target')
  )
);

process.stdout.write(markup);
