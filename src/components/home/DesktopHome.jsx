'use client';

import Link from 'next/link';
import {
  Activity,
  ArrowRight,
  Calendar,
  Clock,
  LayoutDashboard,
  LayoutGrid,
  Medal,
  ShoppingCart,
  Swords,
  Target,
  Trophy,
  User,
  Users,
} from 'lucide-react';

import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import HeroHeader from './HeroHeader';

const cards = [
  [
    'Dashboard',
    'Análisis global de la competición',
    LayoutDashboard,
    '/dashboard',
    'primary',
    '0.1s',
  ],
  ['Clasificación', 'Tabla completa y datos históricos', Trophy, '/standings', 'yellow', '0.2s'],
  ['Jugadores', 'Estadísticas detalladas e historial', User, '/players', 'blue', '0.3s'],
  ['Mercado', 'Tendencias de mercado', ShoppingCart, '/market', 'green', '0.4s'],
  ['Partidos', 'Próximos partidos y resultados', Calendar, '/matches', 'red', '0.5s'],
  ['Alineaciones', 'Gestión de tu alineación', Users, '/schedule', 'purple', '0.6s'],
  ['Jornadas', 'Calendario y resultados por jornada', Clock, '/rounds', 'orange', '0.7s'],
  ['Torneos', 'Historial de Copas y Eliminatorias', Medal, '/tournaments', 'amber', '0.75s'],
  ['Porras', 'Predicciones y logros de la temporada', Target, '/predictions', 'pink', '0.8s'],
  ['Playoffs', 'Predicciones y seguimiento de la fase final', Swords, '/playoffs', 'rose', '0.82s'],
  [
    'Hoopgrid',
    'El juego diario de Euroleague. ¿Podrás completar el 3x3?',
    LayoutGrid,
    '/hoopgrid',
    'primary',
    '0.85s',
  ],
  ['Comparador', 'Cara a cara entre usuarios', Activity, '/compare', 'indigo', '0.9s'],
];

export default function DesktopHome() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <HeroHeader />

      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display mb-10 flex items-center gap-4">
            <span className="w-1.5 h-10 bg-primary rounded-full" />
            <span className="text-foreground">Páginas </span>
            <span className="text-gradient">Disponibles</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map(([title, description, Icon, href, color, delay]) => (
              <Link key={href} href={href} style={{ animationDelay: delay }}>
                <ElegantCard
                  title={title}
                  icon={Icon}
                  color={color}
                  className="h-full hover:-translate-y-1 transition-transform duration-300 group"
                >
                  <div className="flex flex-col h-full">
                    <p className="text-muted-foreground text-base mb-6">{description}</p>
                    <div className="mt-auto flex translate-x-0 items-center text-sm font-medium text-primary opacity-100 transition-all duration-300 lg:-translate-x-2 lg:opacity-0 lg:group-hover:translate-x-0 lg:group-hover:opacity-100">
                      Abrir Página <ArrowRight size={16} className="ml-1" />
                    </div>
                  </div>
                </ElegantCard>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
