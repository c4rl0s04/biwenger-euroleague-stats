import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';

import type { TransferActivityItem, TransferParty } from '@/lib/home/contracts';
import { formatExactMoney, formatSignedMoney, formatSignedPercentage } from '@/lib/home/formatters';
import { compareTransferValue, type TransferValueAssessment } from '@/lib/home/transfer-value';
import HomeManagerAvatar from './HomeManagerAvatar';

const hourFormatter = new Intl.DateTimeFormat('es-ES', {
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Europe/Madrid',
});

const assessmentLabels: Record<TransferValueAssessment, string> = {
  saving: 'Ahorro',
  overpay: 'Sobreprecio',
  favorable_sale: 'Venta favorable',
  below_market_sale: 'Venta por debajo',
  at_market: 'A precio de mercado',
  unavailable: 'Valor no disponible',
};

function positionTone(position: string | null) {
  const normalized = position?.toLocaleLowerCase('es-ES') ?? '';
  if (normalized.includes('base')) return 'base';
  if (normalized.includes('alero')) return 'alero';
  if (normalized.includes('pivot') || normalized.includes('pívot')) return 'pivot';
  return 'other';
}

function Manager({ party }: { party: TransferParty }) {
  const content = (
    <>
      <HomeManagerAvatar
        name={party.name}
        icon={party.icon}
        colorIndex={party.colorIndex}
        isMarket={party.isMarket}
        size="medium"
      />
      <span>{party.name}</span>
    </>
  );

  return party.id ? (
    <Link href={`/user/${party.id}`} prefetch className="mobile-home-transfer-manager">
      {content}
    </Link>
  ) : (
    <span className="mobile-home-transfer-manager">{content}</span>
  );
}

export default function TransferActivityCard({
  transfer,
  position,
  total,
}: {
  transfer: TransferActivityItem;
  position: number;
  total: number;
}) {
  const tone = positionTone(transfer.player.position);
  const comparison = compareTransferValue({
    transactionPrice: transfer.amount,
    marketValue: transfer.marketValue,
    sellerIsMarket: transfer.seller.isMarket,
    buyerIsMarket: transfer.buyer.isMarket,
  });
  const comparisonLabel = assessmentLabels[comparison.assessment];

  return (
    <article
      className="mobile-home-transfer-card"
      data-transfer-card
      role="listitem"
      aria-label={`${transfer.player.name}, fichaje ${position} de ${total}`}
      aria-posinset={position}
      aria-setsize={total}
    >
      <div className="mobile-home-transfer-body">
        <div className="mobile-home-transfer-overview">
          <Link
            href={`/player/${transfer.player.id}`}
            prefetch
            className="mobile-home-transfer-portrait"
            aria-label={`Abrir perfil de ${transfer.player.name}`}
          >
            {transfer.player.image ? (
              <Image
                src={transfer.player.image}
                alt={`Foto de ${transfer.player.name}`}
                fill
                sizes="88px"
              />
            ) : (
              <span>{transfer.player.teamCode ?? transfer.player.name.slice(0, 2)}</span>
            )}
            <span className={`mobile-home-position-badge is-${tone}`}>
              {transfer.player.position ?? 'Jugador'}
            </span>
          </Link>

          <div className="mobile-home-transfer-summary">
            <div className="mobile-home-transfer-identity">
              <Link href={`/player/${transfer.player.id}`} prefetch>
                {transfer.player.name}
              </Link>
              <time dateTime={transfer.occurredAt}>
                {hourFormatter.format(new Date(transfer.occurredAt))}
              </time>
            </div>
            <span className="mobile-home-transfer-price-label">Operación</span>
            <strong className="mobile-home-transfer-price">
              {formatExactMoney(transfer.amount)}
            </strong>
          </div>
        </div>
        <div className={`mobile-home-transfer-values is-${comparison.tone}`}>
          {transfer.marketValue !== null && comparison.difference !== null ? (
            <>
              <div className="mobile-home-transfer-market-value">
                <span>Valor de mercado</span>
                <strong>{formatExactMoney(transfer.marketValue)}</strong>
              </div>
              <div className="mobile-home-transfer-difference">
                <span>{comparisonLabel}</span>
                <strong>{formatSignedMoney(comparison.difference)}</strong>
                <small>{formatSignedPercentage(comparison.percentage ?? 0)}</small>
              </div>
            </>
          ) : (
            <span className="mobile-home-transfer-value-unavailable">Valor no disponible</span>
          )}
        </div>
        <div
          className="mobile-home-transfer-flow"
          aria-label={`${transfer.seller.name} vende a ${transfer.buyer.name}`}
        >
          <Manager party={transfer.seller} />
          <ArrowRight size={18} aria-hidden="true" />
          <Manager party={transfer.buyer} />
        </div>
      </div>
    </article>
  );
}
