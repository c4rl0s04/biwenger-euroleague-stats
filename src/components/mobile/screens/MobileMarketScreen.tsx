import { ChartSpline, CircleDollarSign, Gavel, ReceiptText, ShoppingBasket } from 'lucide-react';

import {
  MobileListRow,
  MobileMetric,
  MobileMetricGrid,
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '../MobileScreen';

type MarketListing = Record<string, any>;
type MarketKpis = Record<string, any>;

const money = new Intl.NumberFormat('es-ES', { notation: 'compact', maximumFractionDigits: 1 });

export default function MobileMarketScreen({
  listings,
  kpis,
  recentTransfers,
}: {
  listings: MarketListing[];
  kpis: MarketKpis;
  recentTransfers: MarketListing[];
}) {
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader eyebrow="Equipo" title="Mercado" description="Disponibles y actividad de la liga" />

      <MobileMetricGrid>
        <MobileMetric label="Disponibles" value={listings.length} tone="accent" />
        <MobileMetric label="Operaciones" value={Number(kpis.total_transfers ?? 0).toLocaleString('es-ES')} />
        <MobileMetric label="Precio medio" value={`${money.format(Number(kpis.avg_value ?? 0))}€`} />
        <MobileMetric label="Compradores" value={kpis.active_buyers ?? 0} tone="positive" />
      </MobileMetricGrid>

      <MobileSectionHeading>Jugadores disponibles</MobileSectionHeading>
      <div>
        {listings.slice(0, 12).map((player) => (
          <MobileListRow
            key={String(player.player_id)}
            href={`/player/${player.player_id}`}
            leading={<span className="mobile-position-chip">{player.position ?? '—'}</span>}
            title={player.name}
            subtitle={`${player.team ?? 'Sin equipo'} · ${Number(player.season_avg ?? 0).toLocaleString('es-ES')} pts`}
            trailing={`${money.format(Number(player.price ?? 0))}€`}
          />
        ))}
      </div>

      <MobileSectionHeading>Actividad reciente</MobileSectionHeading>
      <div>
        {recentTransfers.slice(0, 4).map((transfer, index) => (
          <MobileListRow
            key={String(transfer.id ?? index)}
            title={transfer.player_name ?? transfer.name ?? 'Movimiento'}
            subtitle={`${transfer.vendedor ?? 'Mercado'} → ${transfer.comprador ?? 'Mercado'}`}
            trailing={`${money.format(Number(transfer.precio ?? transfer.price ?? 0))}€`}
          />
        ))}
      </div>

      <MobileSectionHeading>Análisis</MobileSectionHeading>
      <div>
        <MobileSectionLink href="/market/transfers" title="Fichajes" description="Historial completo de operaciones" icon={ReceiptText} />
        <MobileSectionLink href="/market/investments" title="Inversiones" description="Plusvalías, pérdidas y oportunidades" icon={CircleDollarSign} accent="green" />
        <MobileSectionLink href="/market/bids" title="Pujas" description="Duelos, sobreprecios y competencia" icon={Gavel} accent="violet" />
        <MobileSectionLink href="/market/trends" title="Tendencias" description="Volumen y precios a lo largo del tiempo" icon={ChartSpline} accent="blue" />
      </div>
    </MobileScreen>
  );
}
