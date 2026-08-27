import {
  Bot,
  Calendar,
  Clock,
  FlaskConical,
  Home,
  LayoutDashboard,
  LayoutGrid,
  Medal,
  Scale,
  ShoppingCart,
  Sparkles,
  Swords,
  Target,
  Trophy,
  User,
  Users,
} from 'lucide-react';

export const NAV_ITEMS = [
  { name: 'Inicio', shortName: 'Inicio', href: '/', icon: Home },
  { name: 'Dashboard', shortName: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Asistente IA', href: '/assistant', icon: Bot },
  { name: 'Clasificación', shortName: 'Clasificación', href: '/standings', icon: Trophy },
  { name: 'Jugadores', href: '/players', icon: User },
  { name: 'Mercado', href: '/market', icon: ShoppingCart },
  { name: 'Partidos', href: '/matches', icon: Calendar },
  { name: 'Alineación', href: '/lineup', icon: Sparkles },
  { name: 'Horario Jugadores', shortName: 'Horario', href: '/schedule', icon: Users },
  { name: 'Jornadas', href: '/rounds', icon: Clock },
  { name: 'Torneos', href: '/tournaments', icon: Medal },
  { name: 'Porras', href: '/predictions', icon: Target },
  { name: 'Playoffs', href: '/playoffs', icon: Swords },
  { name: 'Hoopgrid', href: '/hoopgrid', icon: LayoutGrid },
  { name: 'Comparativa', href: '/compare', icon: Scale },
  { name: 'Análisis 25/26', href: '/season-review', icon: FlaskConical },
];

const MOBILE_PRIMARY_HREFS = ['/', '/schedule', '/dashboard', '/standings'];

export const MOBILE_PRIMARY_ITEMS = MOBILE_PRIMARY_HREFS.map((href) =>
  NAV_ITEMS.find((item) => item.href === href)
).filter((item) => item !== undefined);

export function isNavigationItemActive(pathname, href) {
  if (href === '/') return pathname === '/';
  if (href === '/players') return pathname === href || pathname.startsWith('/player/');
  return pathname === href || pathname.startsWith(`${href}/`);
}
