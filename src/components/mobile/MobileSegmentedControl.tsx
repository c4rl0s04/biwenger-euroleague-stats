import Link from 'next/link';

interface MobileSegment {
  label: string;
  href: string;
  active?: boolean;
}

export default function MobileSegmentedControl({
  label,
  items,
}: {
  label: string;
  items: MobileSegment[];
}) {
  return (
    <nav className="mobile-segmented-control" aria-label={label}>
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
