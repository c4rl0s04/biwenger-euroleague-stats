import Link from 'next/link';
import { ArrowRight, CalendarDays, Search, ShoppingBag } from 'lucide-react';

export default function HomePreseasonState({ seasonName }: { seasonName: string }) {
  const links = [
    { href: '/players', label: 'Jugadores', icon: Search },
    { href: '/market', label: 'Mercado', icon: ShoppingBag },
    { href: '/schedule', label: 'Horario', icon: CalendarDays },
  ];

  return (
    <section className="mobile-home-preseason" aria-labelledby="preseason-title">
      <span className="mobile-home-preseason-kicker">Preparando {seasonName}</span>
      <h2 id="preseason-title">La liga aún está calentando</h2>
      <p>
        Esta portada empezará a registrar movimientos y jornadas en cuanto arranque la temporada
        configurada.
      </p>
      <div>
        {links.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} prefetch>
            <Icon size={16} aria-hidden="true" /> {label}{' '}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        ))}
      </div>
    </section>
  );
}
