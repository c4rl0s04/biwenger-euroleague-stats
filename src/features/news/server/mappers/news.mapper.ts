import type { NewsFeedItem } from '../../models/news';
import type { FeedMatch, FeedResult } from '@/features/matches/public';
import type { getRecentTransfers, getSignificantPriceChanges } from '@/features/market/server';

type Transfer = Awaited<ReturnType<typeof getRecentTransfers>>[number];
type PriceChange = Awaited<ReturnType<typeof getSignificantPriceChanges>>[number];
const currency = (value: number) =>
  new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);

export function mapTransfer(t: Transfer): NewsFeedItem {
  return {
    type: 'transfer',
    text: `FICHAJE: ${t.player_name} (${t.position}) pasa de ${t.vendedor || 'Mercado'} a ${t.comprador || 'Mercado'} por ${currency(Number(t.precio))}`,
    timestamp: t.timestamp,
  };
}
export function mapPriceChange(c: PriceChange, now: () => number): NewsFeedItem {
  const increment = Number(c.price_increment);
  return {
    type: increment > 0 ? 'price_up' : 'price_down',
    text: `MERCADO: ${c.name} ${increment > 0 ? 'sube' : 'baja'} ${currency(Math.abs(increment))} hoy`,
    timestamp: now(),
  };
}
export function mapUpcomingMatch(m: FeedMatch): NewsFeedItem {
  // null historically reaches new Date(null), which means the Unix epoch.
  const date = new Date(m.date === null ? 0 : m.date);
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  const day = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
  return {
    type: 'match',
    text: `PRÓXIMO: ${m.homeTeam} vs ${m.awayTeam} (${day} ${time})`,
    timestamp: date.getTime(),
  };
}
export function mapResult(m: FeedResult): NewsFeedItem {
  return {
    type: 'result',
    text: `RESULTADO: ${m.homeTeam} ${m.homeScore} - ${m.awayScore} ${m.awayTeam}`,
    timestamp: new Date(m.date === null ? 0 : m.date).getTime(),
  };
}
