import Link from 'next/link';
import { CalendarRange, ShoppingBag, UsersRound } from 'lucide-react';

const actions = [
  { href: '/lineup', label: 'Alineación', icon: UsersRound },
  { href: '/market', label: 'Mercado', icon: ShoppingBag },
] as const;

export default function HomeQuickActions({ roundId }: { roundId: number | null }) {
  return (
    <nav className="mobile-home-quick-actions" aria-label="Accesos rápidos">
      {actions.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} prefetch>
          <Icon size={18} strokeWidth={2.1} aria-hidden="true" />
          <span>{label}</span>
        </Link>
      ))}
      <Link href={roundId ? `/rounds/${roundId}/stats` : '/rounds'} prefetch>
        <CalendarRange size={18} strokeWidth={2.1} aria-hidden="true" />
        <span>Jornada</span>
      </Link>
    </nav>
  );
}
