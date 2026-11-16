import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it, vi } from 'vitest';
import type { RecentTransfer } from '@/features/market/public';
import { TransferActivityList } from './TransferActivityList';

vi.mock('@/components/ui', () => ({
  AnimatedNumber: ({ value, suffix }: { value: number; suffix: string }) => (
    <span>
      {value}
      {suffix}
    </span>
  ),
}));
const transfer: RecentTransfer = {
  id: 0,
  season_id: 'fixture',
  timestamp: 1760000000,
  fecha: null,
  player_id: 0,
  precio: 0,
  vendedor: 'Seller',
  comprador: 'Buyer',
  player_name: 'Transferred player',
  position: 'Base',
  vendedor_id: '0',
  vendedor_color_index: 0,
  comprador_id: '7',
  comprador_color_index: 1,
};
it('keeps all three destinations independent, including zero identities and amounts', () => {
  const html = renderToStaticMarkup(<TransferActivityList transfers={[transfer]} />);
  expect(html).toContain('<ul');
  expect(html).not.toContain('<ol');
  for (const href of ['/player/0', '/user/0', '/user/7']) expect(html).toContain(`href="${href}"`);
  expect(html).toContain('0€');
  expect(html).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/);
});
it('renders market counterparties and missing player identities as unlinked text', () => {
  const html = renderToStaticMarkup(
    <TransferActivityList
      transfers={[
        {
          ...transfer,
          player_id: null,
          vendedor: 'Mercado',
          vendedor_id: null,
          comprador_id: null,
        },
      ]}
    />
  );
  expect(html).toContain('Mercado');
  expect(html).not.toContain('href=');
  expect(renderToStaticMarkup(<TransferActivityList transfers={[]} />)).toContain(
    'No hay fichajes recientes'
  );
});
