import { expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import type {
  MarketMetricCategory,
  MarketMetricFields,
  MarketMetricDefinition,
  MarketBaseRowProps,
} from '../../../models/market-metric';
vi.mock('@/components/ui/BaseRow', () => ({
  default: (props: MarketBaseRowProps) => (
    <div
      data-rank={props.rank}
      data-index={props.idx}
      data-link={props.linkPath}
      data-top={String(props.isTop3)}
    >
      <span>{props.name}</span>
      <label>{props.valueLabel}</label>
      <strong>{props.valueText}</strong>
      <section>{props.valueSub}</section>
      {props.children}
    </div>
  ),
}));
import BaseRow from './BaseRow';
import SharedBaseRow from '@/components/ui/BaseRow';
import PlayerStatRow from './PlayerStatRow';
import UserStatRow from './UserStatRow';
import TransactionStatRow from './TransactionStatRow';
import TemporalStatRow from './TemporalStatRow';
import { METRIC_REGISTRY, getMetricConfig } from './registry';
import { resolveIdentity } from './utils';

const cases: [MarketMetricCategory, string, MarketMetricFields, string, string | number][] = [
  ['PLAYER', 'transfers_owners', { transfer_count: 3 }, 'Total Fichajes', 3],
  [
    'PLAYER',
    'absences',
    { missed_rounds: 2, available_rounds: 5, played_rounds: 3 },
    'Ausencias',
    '2',
  ],
  [
    'PLAYER',
    'revaluation',
    { revaluation: -12, purchase_price: 20, current_price: 8 },
    'Depreciación',
    '12€',
  ],
  [
    'PLAYER',
    'missed_profit',
    { missed_profit: 10, sale_price: 20, current_price: 30 },
    'Beneficio Perdido',
    '10€',
  ],
  [
    'PLAYER',
    'points_million',
    { points_per_million: 2.345, total_points: 5 },
    'Puntos / Millón',
    '2.35',
  ],
  ['USER', 'investment', { total_spent: 10, purchases_count: 1 }, 'Inversión Total', '10€'],
  ['USER', 'steals', { stolen_count: 2 }, 'Jugadores Robados', 2],
  ['USER', 'failed_bids', { failed_bids_count: 3 }, 'Jugadores Perdidos', 3],
  ['USER', 'overpay', { total_overpay: 10, contested_wins: 2 }, 'Sobrepago Total', '10€'],
  ['USER', 'profit', { net_profit: -5, sales_count: 1 }, 'Beneficio Neto', '-5 €'],
  ['USER', 'trades', { trade_count: 0 }, 'Operaciones', 0],
  [
    'TRANSACTION',
    'robbery',
    { price_diff: 5, winning_price: 20, second_highest_bid: 15 },
    'Margen de Victoria',
    '+5€',
  ],
  [
    'TRANSACTION',
    'inflation',
    { inflation: 5, purchase_price: 20, market_price: 15 },
    'Sobreprecio Pagado',
    '+5€',
  ],
  ['TRANSACTION', 'auction', { bid_count: 3, precio: 20 }, 'Pujas', 3],
  [
    'TRANSACTION',
    'transfer',
    { vendedor: 'Mercado', comprador: 'Synthetic Buyer', precio: 20 },
    'Precio Traspaso',
    '20€',
  ],
  [
    'TEMPORAL',
    'quickflip',
    { hours_held: 0.5, profit: -10, purchase_price: 20, sale_price: 10 },
    'Beneficio Quickflip',
    '+10€',
  ],
  [
    'TEMPORAL',
    'revaluation_flip',
    { days_held: 3.8, profit: 10, purchase_price: 20, sale_price: 30 },
    'Beneficio Realizado',
    '+10€',
  ],
  [
    'TEMPORAL',
    'revaluation_open',
    { percentage_gain: 12.5, purchase_price: 20, current_price: 30 },
    'Rentabilidad',
    '+13%',
  ],
  [
    'TEMPORAL',
    'missed_profit_item',
    { missed_profit: 10, sale_price: 20, current_price: 30, is_repurchase: true },
    'Beneficio Perdido',
    '10€',
  ],
  [
    'TEMPORAL',
    'generic_flip',
    { purchase_price: 20, sale_price: 5, profit: -15 },
    'Pérdida',
    '15€',
  ],
];

const content = (value: MarketMetricDefinition['value'], item: MarketMetricFields) =>
  typeof value === 'function' ? value(item) : value;

it.each(cases)('preserves %s/%s selection, label and value', (category, id, item, label, value) => {
  const config = getMetricConfig(item, category)!;
  expect(config.id).toBe(id);
  expect(content(config.label, item)).toBe(label);
  expect(content(config.value, item)).toBe(value);
  // Exercise real markup-producing callbacks, not just their existence.
  renderToStaticMarkup(
    <>
      {content(config.sub, item)}
      {content(config.info, item)}
    </>
  );
});

it('covers every registered metric and preserves category/first-match behavior', () => {
  expect(
    Object.entries(METRIC_REGISTRY).flatMap(([category, metrics]) =>
      metrics.map((metric) => `${category}/${metric.id}`)
    )
  ).toEqual(cases.map(([category, id]) => `${category}/${id}`));
  expect(getMetricConfig({}, 'UNKNOWN')).toBeNull();
  expect(getMetricConfig({}, 'PLAYER')).toBeNull();
  expect(getMetricConfig({ transfer_count: 0, missed_rounds: 1 }, 'PLAYER')?.id).toBe(
    'transfers_owners'
  );
  expect(getMetricConfig({ price_diff: 0, bid_count: 3 }, 'TRANSACTION')?.id).toBe('robbery');
});

it('preserves zero fallbacks and percentage-only summary behavior', () => {
  const item = { net_profit: 0, total_profit: 5 };
  expect(content(getMetricConfig(item, 'USER')!.value, item)).toBe('+5 €');
  const percent = { percentage_gain: 12 };
  const summary = getMetricConfig(percent, 'TEMPORAL')!.summary!;
  expect(
    typeof summary.key === 'function'
      ? summary.key(percent)
      : percent[summary.key as keyof typeof percent]
  ).toBeUndefined();
  expect(content(summary.label, percent)).toBe('Depreciación Total');
});

it.each([
  [0.5, '30m'],
  [2, '2.0h'],
  [48, '2.0d'],
] as const)('preserves holding time %s', (hours_held, text) => {
  const item = { hours_held };
  expect(
    renderToStaticMarkup(<>{content(getMetricConfig(item, 'TEMPORAL')!.sub, item)}</>)
  ).toContain(text);
});

it('preserves source/sink links and repurchase wording', () => {
  const transfer = {
    vendedor: 'Biwenger',
    comprador: 'Synthetic Buyer',
    buyer_id: '8',
    precio: 20,
  };
  const html = renderToStaticMarkup(
    <>{content(getMetricConfig(transfer, 'TRANSACTION')!.info, transfer)}</>
  );
  expect(html).toContain('href="#"');
  expect(html).toContain('href="/user/8"');
  const missed = { missed_profit: 5, is_repurchase: true };
  expect(content(getMetricConfig(missed, 'TEMPORAL')!.sub, missed)).toContain('R:');
});

it('keeps the facade as the identical shared component, not a wrapper', () => {
  expect(BaseRow).toBe(SharedBaseRow);
});

it.each([
  [
    PlayerStatRow,
    'player',
    { player_id: 9, player_name: 'Synthetic', transfer_count: 2 },
    'Total Fichajes',
  ],
  [
    UserStatRow,
    'user',
    { user_id: '7', name: 'Synthetic', total_spent: 10, purchases_count: 1 },
    'Inversión Total',
  ],
  [
    TransactionStatRow,
    'transaction',
    { player_id: 9, bid_count: 2, comprador: 'Synthetic', buyer_id: '7' },
    'Pujas',
  ],
  [TemporalStatRow, 'temporal', { player_id: 9, purchase_price: 20, sale_price: 5 }, 'Pérdida'],
] as const)('renders real metric selection through row %s', (Row, statType, item, label) => {
  const html = renderToStaticMarkup(
    <Row item={item} localIdx={1} globalIdx={3} statType={statType} />
  );
  expect(html).toContain(label);
  expect(html).toContain('data-rank="4"');
  expect(html).toContain('data-index="1"');
  expect(html).toContain('data-top="false"');
});

it.each([
  [PlayerStatRow, 'player', 'Valor'],
  [UserStatRow, 'user', 'Total'],
  [TransactionStatRow, 'transaction', 'Precio Traspaso'],
  [TemporalStatRow, 'temporal', 'Valor'],
] as const)('preserves fallback output through row %s', (Row, statType, label) => {
  const html = renderToStaticMarkup(
    <Row item={{}} localIdx={0} globalIdx={0} statType={statType} />
  );
  expect(html).toContain(label);
  expect(html).toContain('data-top="true"');
});

it('preserves identity precedence, truthy IDs, legacy plural player links and zero color index', () => {
  const manager = resolveIdentity(
    { user_id: '7', user_name: 'Synthetic', user_color_index: 0 },
    'player'
  );
  expect(manager.isUser).toBe('7');
  expect(manager.linkPath).toBe('/user/7');
  expect(manager.primaryColor.text).toBe('text-blue-400');
  const player = resolveIdentity(
    { player_id: 9, user_id: '7', player_name: 'Player', user_name: 'Manager' },
    'temporal'
  );
  expect(player.linkPath).toBe('/players/9');
  expect(player.name).toBe('Player');
  expect(player.managerName).toBe('Manager');
  const transaction = resolveIdentity(
    { player_id: 9, buyer_id: '8', comprador: 'Buyer', user_id: '7', user_name: 'Owner' },
    'transaction'
  );
  expect(transaction.managerId).toBe('8');
  expect(transaction.managerName).toBe('Buyer');
});
