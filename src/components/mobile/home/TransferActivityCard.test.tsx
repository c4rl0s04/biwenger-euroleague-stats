import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import type { TransferActivityItem } from '@/lib/home/contracts';
import TransferActivityCard from './TransferActivityCard';

const baseTransfer: TransferActivityItem = {
  id: 'transfer:1',
  occurredAt: '2026-10-20T20:30:00.000Z',
  player: {
    id: 10,
    name: 'Mike James',
    position: 'Base',
    image: null,
    teamCode: 'MON',
  },
  seller: {
    id: null,
    name: 'Mercado',
    icon: null,
    colorIndex: 0,
    isMarket: true,
  },
  buyer: {
    id: '7',
    name: 'All Stars',
    icon: null,
    colorIndex: 2,
    isMarket: false,
  },
  amount: 3_500_000,
  marketValue: 3_000_000,
  marketValueAt: '2026-10-20',
};

describe('mobile transfer card', () => {
  it.each([
    ['Base', 'base'],
    ['Alero', 'alero'],
    ['Pívot', 'pivot'],
  ])('renders %s with its semantic position tone', (positionLabel, tone) => {
    const transfer = {
      ...baseTransfer,
      player: { ...baseTransfer.player, position: positionLabel },
    };
    const html = renderToStaticMarkup(
      <TransferActivityCard transfer={transfer} position={1} total={3} />
    );

    expect(html).toContain(`is-${tone}`);
    expect(html).toContain(positionLabel);
    expect(html).toContain('3.500.000 €');
    expect(html).toContain('Mercado');
    expect(html).toContain('All Stars');
  });

  it('uses the team code when the player portrait and manager icon are absent', () => {
    const html = renderToStaticMarkup(
      <TransferActivityCard transfer={baseTransfer} position={1} total={1} />
    );

    expect(html).toContain('MON');
    expect(html).toContain('aria-label="Mike James, fichaje 1 de 1"');
  });

  it('renders the available player portrait and manager icon in one pass', () => {
    const transfer = {
      ...baseTransfer,
      player: { ...baseTransfer.player, image: 'https://cdn.example.com/player.png' },
      buyer: { ...baseTransfer.buyer, icon: 'https://cdn.example.com/manager.png' },
    };
    const html = renderToStaticMarkup(
      <TransferActivityCard transfer={transfer} position={1} total={1} />
    );

    expect(html).toContain('Foto de Mike James');
    expect(html).toContain('manager.png');
  });

  it('uses a square portrait beside the player summary instead of a panoramic header', () => {
    const html = renderToStaticMarkup(
      <TransferActivityCard transfer={baseTransfer} position={1} total={1} />
    );
    const css = readFileSync(new URL('../../../app/mobile-native.css', import.meta.url), 'utf8');

    expect(html).toMatch(
      /mobile-home-transfer-overview[\s\S]*mobile-home-transfer-portrait[\s\S]*mobile-home-transfer-summary/
    );
    expect(css).toMatch(
      /\.mobile-home-transfer-portrait\s*\{[\s\S]*?width:\s*5\.5rem;[\s\S]*?aspect-ratio:\s*1;/
    );
  });

  it('shows transaction value, historical market value, and a buyer-facing overprice', () => {
    const html = renderToStaticMarkup(
      <TransferActivityCard transfer={baseTransfer} position={1} total={1} />
    );

    expect(html).toContain('Operación');
    expect(html).toContain('3.500.000 €');
    expect(html).toContain('Valor de mercado');
    expect(html).toContain('3.000.000 €');
    expect(html).toContain('Sobreprecio');
    expect(html).toContain('+500.000 €');
    expect(html).toContain('+16,7 %');
    expect(html).toContain('is-negative');
  });

  it('shows a favorable sale in green when a manager sells above market', () => {
    const transfer = {
      ...baseTransfer,
      seller: { ...baseTransfer.buyer, name: 'All Stars' },
      buyer: { ...baseTransfer.seller, name: 'Mercado' },
    };
    const html = renderToStaticMarkup(
      <TransferActivityCard transfer={transfer} position={1} total={1} />
    );

    expect(html).toContain('Venta favorable');
    expect(html).toContain('is-positive');
  });

  it('states when the historical market value is unavailable without estimating it', () => {
    const transfer = { ...baseTransfer, marketValue: null, marketValueAt: null };
    const html = renderToStaticMarkup(
      <TransferActivityCard transfer={transfer} position={1} total={1} />
    );

    expect(html).toContain('Valor no disponible');
    expect(html).not.toContain('Sobreprecio');
  });
});
