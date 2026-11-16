import { renderToStaticMarkup } from 'react-dom/server';
import { expect, it } from 'vitest';
import { ManagerStatList } from './ManagerStatList';

it('renders ordered identities, valid zero IDs, subtitles and zero/negative metrics', () => {
  const items = [
    { id: 0, name: 'Zero manager', value: 0 },
    { id: 7, name: 'Second', value: -12 },
  ];
  const html = renderToStaticMarkup(
    <ManagerStatList
      items={items}
      getKey={(item) => item.id}
      getIdentity={(item) => ({ id: item.id, name: item.name, subtitle: 'Jornada 6' })}
      renderMetric={(item) => <span>{item.value} pts</span>}
    />
  );
  expect(html).toContain('<ol');
  expect(html).toContain('href="/user/0"');
  expect(html).toContain('Jornada 6');
  expect(html).toContain('0 pts');
  expect(html).toContain('-12 pts');
  expect(html.indexOf('Zero manager')).toBeLessThan(html.indexOf('Second'));
});
it('renders unavailable identities without invalid links and preserves the empty message', () => {
  const html = renderToStaticMarkup(
    <ManagerStatList
      items={[{ key: 'missing' }]}
      getKey={(item) => item.key}
      getIdentity={() => ({ id: null, name: null })}
      renderMetric={() => '/'}
    />
  );
  expect(html).not.toContain('href=');
  expect(html).toContain('Usuario');
  const empty = renderToStaticMarkup(
    <ManagerStatList
      items={[]}
      getKey={() => ''}
      getIdentity={() => ({ id: null, name: null })}
      renderMetric={() => null}
      emptyMessage="Sin registros"
    />
  );
  expect(empty).toContain('Sin registros');
});
