'use client';

import HeroHeader from '@/components/home/HeroHeader';
import {
  LayoutDashboard,
  Users,
  Trophy,
  ArrowRight,
  User,
  ShoppingCart,
  Calendar,
  Target,
  Clock,
  Activity,
  Medal,
  LayoutGrid,
  Swords,
} from 'lucide-react';
import Link from 'next/link';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

export default function Home() {
  const cards = [
    {
      title: 'Dashboard',
      description: 'Análisis global de la competición',
      icon: LayoutDashboard,
      href: '/dashboard',
      color: 'primary',
      delay: '0.1s',
      disabled: false,
    },
    {
      title: 'Clasificación',
      description: 'Tabla completa y datos históricos',
      icon: Trophy,
      href: '/standings',
      color: 'yellow',
      delay: '0.2s',
      disabled: false,
    },
    {
      title: 'Jugadores',
      description: 'Estadísticas detalladas e historial',
      icon: User,
      href: '/players',
      color: 'blue',
      delay: '0.3s',
      disabled: false,
    },
    {
      title: 'Mercado',
      description: 'Tendencias de mercado',
      icon: ShoppingCart,
      href: '/market',
      color: 'green',
      delay: '0.4s',
      disabled: false,
    },
    {
      title: 'Partidos',
      description: 'Próximos partidos y resultados',
      icon: Calendar,
      href: '/matches',
      color: 'red',
      delay: '0.5s',
      disabled: false,
    },
    {
      title: 'Alineaciones',
      description: 'Gestión de tu alineación',
      icon: Users,
      href: '/schedule',
      color: 'purple',
      delay: '0.6s',
      disabled: false,
    },
    {
      title: 'Jornadas',
      description: 'Calendario y resultados por jornada',
      icon: Clock,
      href: '/rounds',
      color: 'orange',
      delay: '0.7s',
      disabled: false,
    },
    {
      title: 'Torneos',
      description: 'Historial de Copas y Eliminatorias',
      icon: Medal,
      href: '/tournaments',
      color: 'amber',
      delay: '0.75s',
      disabled: false,
    },
    {
      title: 'Porras',
      description: 'Predicciones y logros de la temporada',
      icon: Target,
      href: '/predictions',
      color: 'pink',
      delay: '0.8s',
      disabled: false,
    },
    {
      title: 'Playoffs',
      description: 'Predicciones y seguimiento de la fase final',
      icon: Swords,
      href: '/playoffs',
      color: 'rose',
      delay: '0.82s',
      disabled: false,
    },
    {
      title: 'Hoopgrid',
      description: 'El juego diario de Euroleague. ¿Podrás completar el 3x3?',
      icon: LayoutGrid,
      href: '/hoopgrid',
      color: 'primary',
      delay: '0.85s',
      disabled: false,
    },
    {
      title: 'Comparador',
      description: 'Cara a cara entre usuarios',
      icon: Activity,
      href: '/compare',
      color: 'indigo',
      delay: '0.9s',
      disabled: false,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <HeroHeader />

      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display mb-10 flex items-center gap-4">
            <span className="w-1.5 h-10 bg-primary rounded-full"></span>
            <span className="text-foreground">Páginas </span>
            <span className="text-gradient">Disponibles</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, idx) => (
              <Link
                key={idx}
                href={card.disabled ? '#' : card.href}
                className={card.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}
                style={{ animationDelay: card.delay }}
              >
                <ElegantCard
                  title={card.title}
                  icon={card.icon}
                  color={card.color}
                  className="h-full hover:-translate-y-1 transition-transform duration-300 group"
                >
                  <div className="flex flex-col h-full">
                    <p className="text-muted-foreground text-base mb-6">{card.description}</p>
                    <div className="mt-auto flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
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
