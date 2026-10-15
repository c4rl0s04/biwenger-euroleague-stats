'use client';

import Link from 'next/link';
import { useEffect, useRef } from 'react';

interface MobileSegment {
  label: string;
  href: string;
  active?: boolean;
}

export default function MobileSegmentedControl({
  label,
  items,
  revealActive = false,
}: {
  label: string;
  items: MobileSegment[];
  revealActive?: boolean;
}) {
  const railRef = useRef<HTMLElement>(null);
  const activeHref = items.find((item) => item.active)?.href;

  useEffect(() => {
    if (!revealActive) return;
    const rail = railRef.current;
    const active = rail?.querySelector<HTMLElement>('[aria-current="page"]');
    if (!rail || !active) return;
    const railBounds = rail.getBoundingClientRect();
    const activeBounds = active.getBoundingClientRect();
    rail.scrollTo({
      left:
        rail.scrollLeft +
        activeBounds.left -
        railBounds.left -
        (rail.clientWidth - activeBounds.width) / 2,
      behavior: 'instant',
    });
  }, [activeHref, revealActive]);

  return (
    <nav ref={railRef} className="mobile-segmented-control" aria-label={label}>
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          prefetch
          className={item.active ? 'mobile-segment-active' : undefined}
          aria-current={item.active ? 'page' : undefined}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
