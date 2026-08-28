'use client';

import { useCallback, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { TransferActivityItem } from '@/lib/home/contracts';
import TransferActivityCard from './TransferActivityCard';

export default function TransferCarousel({ transfers }: { transfers: TransferActivityItem[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const updateActiveIndex = useCallback(() => {
    const rail = railRef.current;
    if (!rail) return;
    const cards = Array.from(rail.querySelectorAll<HTMLElement>('[data-transfer-card]'));
    if (cards.length === 0) return;
    const closest = cards.reduce(
      (best, card, index) => {
        const distance = Math.abs(card.offsetLeft - rail.scrollLeft);
        return distance < best.distance ? { index, distance } : best;
      },
      { index: 0, distance: Number.POSITIVE_INFINITY }
    );
    setActiveIndex(closest.index);
  }, []);

  const handleScroll = useCallback(() => {
    if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    frameRef.current = requestAnimationFrame(updateActiveIndex);
  }, [updateActiveIndex]);

  const moveTo = useCallback((index: number) => {
    const rail = railRef.current;
    const card = rail?.querySelectorAll<HTMLElement>('[data-transfer-card]')[index];
    if (!rail || !card) return;
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    rail.scrollTo({ left: card.offsetLeft, behavior: reduceMotion ? 'auto' : 'smooth' });
    setActiveIndex(index);
  }, []);

  return (
    <div className="mobile-home-transfer-carousel">
      <div
        ref={railRef}
        className="mobile-home-transfer-rail"
        onScroll={handleScroll}
        role="list"
        aria-label={`Carrusel de ${transfers.length} fichajes`}
      >
        {transfers.map((transfer, index) => (
          <TransferActivityCard
            key={transfer.id}
            transfer={transfer}
            position={index + 1}
            total={transfers.length}
          />
        ))}
      </div>

      {transfers.length > 1 && (
        <div className="mobile-home-transfer-controls">
          <span aria-live="polite">
            {activeIndex + 1} / {transfers.length}
          </span>
          <div>
            <button
              type="button"
              onClick={() => moveTo(activeIndex - 1)}
              disabled={activeIndex === 0}
              aria-label="Fichaje anterior"
            >
              <ChevronLeft size={19} aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => moveTo(activeIndex + 1)}
              disabled={activeIndex === transfers.length - 1}
              aria-label="Fichaje siguiente"
            >
              <ChevronRight size={19} aria-hidden="true" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
