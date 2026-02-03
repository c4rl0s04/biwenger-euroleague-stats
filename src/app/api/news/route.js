export const dynamic = 'force-dynamic'; // Always fetch fresh data

import { NextResponse } from 'next/server';
import { getRecentTransfers, getSignificantPriceChanges } from '@/lib/db';
import { getUpcomingMatches, getRecentResults } from '@/lib/db';

export async function GET() {
  try {
    const news = [];

    // 1. Recent Transfers (Top 5)
    try {
      const transfers = await getRecentTransfers(5);
      transfers.forEach((t) => {
        const amount = new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits: 0,
        }).format(t.precio);
        const buyer = t.comprador || 'Mercado';
        const seller = t.vendedor || 'Mercado';
        news.push({
          type: 'transfer',
          text: `FICHAJE: ${t.player_name} (${t.position}) pasa de ${seller} a ${buyer} por ${amount}`,
          timestamp: t.timestamp,
        });
      });
    } catch (e) {
      console.error('Error fetching transfers:', e);
    }

    // 2. Significant Price Changes
    try {
      const priceChanges = await getSignificantPriceChanges(24, 200000); // >200k change
      priceChanges.forEach((c) => {
        const amount = new Intl.NumberFormat('es-ES', {
          style: 'currency',
          currency: 'EUR',
          maximumFractionDigits: 0,
        }).format(Math.abs(c.price_increment));
        const direction = c.price_increment > 0 ? 'sube' : 'baja';
        // const icon = c.price_increment > 0 ? '📈' : '📉'; // Removed
        news.push({
          type: c.price_increment > 0 ? 'price_up' : 'price_down', // Distinguished types for icon mapping
          text: `MERCADO: ${c.name} ${direction} ${amount} hoy`,
          timestamp: Date.now(),
        });
      });
    } catch (e) {
      console.error('Error fetching price changes:', e);
    }

    // 3. Upcoming Matches
    try {
      const matches = await getUpcomingMatches(3);
      matches.forEach((m) => {
        const date = new Date(m.date);
        const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        const day = date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric' });
        news.push({
          type: 'match',
          text: `PRÓXIMO: ${m.home_team} vs ${m.away_team} (${day} ${time})`,
          timestamp: new Date(m.date).getTime(),
        });
      });
    } catch (e) {
      console.error('Error fetching upcoming matches:', e);
    }

    // 4. Recent Results
    try {
      const results = await getRecentResults(3);
      results.forEach((m) => {
        news.push({
          type: 'result',
          text: `RESULTADO: ${m.home_team} ${m.home_score} - ${m.away_score} ${m.away_team}`,
          timestamp: new Date(m.date).getTime(),
        });
      });
    } catch (e) {
      console.error('Error fetching results:', e);
    }

    // Shuffle slightly or order by type? Random shuffle keeps it interesting.
    // Simple shuffle
    const shuffled = news.sort(() => 0.5 - Math.random());

    return NextResponse.json(shuffled);
  } catch (error) {
    console.error('News API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
