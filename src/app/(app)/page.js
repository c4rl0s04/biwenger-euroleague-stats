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
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

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
      description: 'Sugerencias de alineación por IA',
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
      title: 'Porras',
      description: 'Predicciones y logros de la temporada',
      icon: Target,
      href: '/predictions',
      color: 'pink',
      delay: '0.8s',
      disabled: false,
    },
    {
      title: 'Assistant',
      description: 'Tu asistente inteligente de Biwenger',
      icon: Sparkles,
      href: '/ai',
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
            {cards.map((card, idx) => {
              return (
                <Link
                  key={idx}
                  href={card.disabled ? '#' : card.href}
                  className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 block ${
                    card.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                  }`}
                  style={{ animationDelay: card.delay }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />

                  <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`text-${card.color}-500 group-hover:scale-110 transition-transform duration-300`}
                      >
                        <card.icon size={40} />
                      </div>

                      <h3 className="text-3xl font-display text-white group-hover:text-primary transition-colors">
                        {card.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-6">{card.description}</p>

                    <div className="flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                      Abrir Página <ArrowRight size={16} className="ml-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
