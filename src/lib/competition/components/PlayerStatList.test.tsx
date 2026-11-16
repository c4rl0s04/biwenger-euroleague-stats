import Link from 'next/link';
import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { PlayerStatList } from './PlayerStatList';

it('preserves player identity, independent owner links and feature-specific badges/metrics', () => {
  const items = [
    { id: 0, name: 'A long player name', score: 0 },
    { id: 9, name: 'Second', score: -3 },
  ];
  const html = renderToStaticMarkup(
    <PlayerStatList
      items={items}
      getKey={(item) => item.id}
      getPlayer={(item) => ({
        id: item.id,
        name: item.name,
        subtitle: <Link href="/user/7">Owner</Link>,
      })}
      renderBadge={(_item, index) => <span>Rank {index + 1}</span>}
      renderMetric={(item) => `${item.score} pts`}
    />
  );
  expect(html).toContain('href="/player/0"');
  expect(html).toContain('href="/user/7"');
  expect(html).toContain('Rank 1');
  expect(html).toContain('0 pts');
  expect(html).toContain('-3 pts');
  expect(html).not.toMatch(/<a\b[^>]*>(?:(?!<\/a>)[\s\S])*<a\b/);
});
it('renders empty and unavailable identities without inventing player links', () => {
  const empty = renderToStaticMarkup(
    <PlayerStatList
      items={[]}
      getKey={() => ''}
      getPlayer={() => ({ id: null, name: null })}
      renderBadge={() => null}
      renderMetric={() => null}
      emptyMessage="Sin jugadores"
    />
  );
  expect(empty).toContain('Sin jugadores');
  const missing = renderToStaticMarkup(
    <PlayerStatList
      items={['unknown']}
      getKey={(item) => item}
      getPlayer={() => ({ id: null, name: null })}
      renderBadge={() => null}
      renderMetric={() => '/'}
    />
  );
  expect(missing).toContain('Jugador');
  expect(missing).not.toContain('href=');
});
