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
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const cards = [
    {
      title: 'Dashboard',
      description: 'Analítica avanzada para tu equipo fantasy',
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
      title: 'Mercado',
      description: 'Tendencias de mercado y estadísticas',
      icon: ShoppingCart,
      href: '/market',
      color: 'green',
      delay: '0.3s',
      disabled: false,
    },
    {
      title: 'Jugadores',
      description: 'Estadísticas detalladas e historial',
      icon: User,
      href: '/players',
      color: 'blue',
      delay: '0.4s',
      disabled: false,
    },
    {
      title: 'Alineaciones',
      description: 'Sugerencias de alineación por IA',
      icon: Users,
      href: '/lineups',
      color: 'purple',
      delay: '0.5s',
      disabled: true,
    },
    {
      title: 'Partidos',
      description: 'Próximos partidos y resultados',
      icon: Calendar,
      href: '/matches',
      color: 'red',
      delay: '0.6s',
      disabled: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-20">
      <HeroHeader />

      <main className="container mx-auto px-4 py-12 relative z-10">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-display mb-10 flex items-center gap-4">
            <span className="w-1.5 h-10 bg-primary rounded-full"></span>
            <span className="text-foreground">Módulos </span>
            <span className="text-gradient">Disponibles</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cards.map((card, idx) => (
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
                  <div
                    className={`w-12 h-12 rounded-xl bg-${card.color}-500/10 flex items-center justify-center mb-4 text-${card.color}-500 group-hover:scale-110 transition-transform duration-300`}
                  >
                    <card.icon size={24} />
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6">{card.description}</p>

                  <div className="flex items-center text-sm font-medium text-primary opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                    Abrir Módulo <ArrowRight size={16} className="ml-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
