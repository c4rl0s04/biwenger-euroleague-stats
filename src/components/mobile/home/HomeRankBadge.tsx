function rankTone(position: number, isLast: boolean) {
  if (position === 1) return 'gold';
  if (position === 2) return 'silver';
  if (position === 3) return 'bronze';
  if (isLast) return 'last';
  return 'neutral';
}

export default function HomeRankBadge({
  position,
  isLast = false,
}: {
  position: number;
  isLast?: boolean;
}) {
  return (
    <span
      className={`mobile-home-rank-badge is-rank-${rankTone(position, isLast)}`}
      aria-label={`Posición ${position}`}
    >
      {position}
    </span>
  );
}
