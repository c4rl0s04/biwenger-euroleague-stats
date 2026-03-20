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
            {cards.map((card, idx) => {
              // Map colors exactly so Tailwind JIT compiler doesn't miss them
              const colorClasses = {
                primary: {
                  border: 'hover:border-primary/50',
                  shadow: 'hover:shadow-primary/10',
                  glow: 'from-primary/5',
                  textHover: 'group-hover:text-primary',
                  text: 'text-primary',
                },
                yellow: {
                  border: 'hover:border-yellow-500/50',
                  shadow: 'hover:shadow-yellow-500/10',
                  glow: 'from-yellow-500/5',
                  textHover: 'group-hover:text-yellow-500',
                  text: 'text-yellow-500',
                },
                blue: {
                  border: 'hover:border-blue-500/50',
                  shadow: 'hover:shadow-blue-500/10',
                  glow: 'from-blue-500/5',
                  textHover: 'group-hover:text-blue-500',
                  text: 'text-blue-500',
                },
                green: {
                  border: 'hover:border-emerald-500/50',
                  shadow: 'hover:shadow-emerald-500/10',
                  glow: 'from-emerald-500/5',
                  textHover: 'group-hover:text-emerald-500',
                  text: 'text-emerald-500',
                },
                red: {
                  border: 'hover:border-red-500/50',
                  shadow: 'hover:shadow-red-500/10',
                  glow: 'from-red-500/5',
                  textHover: 'group-hover:text-red-500',
                  text: 'text-red-500',
                },
                purple: {
                  border: 'hover:border-purple-500/50',
                  shadow: 'hover:shadow-purple-500/10',
                  glow: 'from-purple-500/5',
                  textHover: 'group-hover:text-purple-500',
                  text: 'text-purple-500',
                },
                orange: {
                  border: 'hover:border-orange-500/50',
                  shadow: 'hover:shadow-orange-500/10',
                  glow: 'from-orange-500/5',
                  textHover: 'group-hover:text-orange-500',
                  text: 'text-orange-500',
                },
                amber: {
                  border: 'hover:border-amber-500/50',
                  shadow: 'hover:shadow-amber-500/10',
                  glow: 'from-amber-500/5',
                  textHover: 'group-hover:text-amber-500',
                  text: 'text-amber-500',
                },
                pink: {
                  border: 'hover:border-pink-500/50',
                  shadow: 'hover:shadow-pink-500/10',
                  glow: 'from-pink-500/5',
                  textHover: 'group-hover:text-pink-500',
                  text: 'text-pink-500',
                },
                indigo: {
                  border: 'hover:border-indigo-500/50',
                  shadow: 'hover:shadow-indigo-500/10',
                  glow: 'from-indigo-500/5',
                  textHover: 'group-hover:text-indigo-500',
                  text: 'text-indigo-500',
                },
              };

              const styles = colorClasses[card.color] || colorClasses.primary;

              return (
                <Link
                  key={idx}
                  href={card.disabled ? '#' : card.href}
                  className={`group relative overflow-hidden rounded-2xl border border-border/50 bg-card/50 backdrop-blur-sm p-6 flex flex-col h-full transition-all duration-300 ${styles.border} hover:shadow-lg ${styles.shadow} hover:-translate-y-1 ${
                    card.disabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''
                  }`}
                  style={{ animationDelay: card.delay }}
                >
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${styles.glow} to-transparent opacity-0 transition-opacity group-hover:opacity-100`}
                  />

                  <div className="relative z-10 flex flex-col flex-1 h-full">
                    <div className="flex items-center gap-4 mb-4">
                      <div
                        className={`${styles.text} group-hover:scale-110 transition-transform duration-300`}
                      >
                        <card.icon size={40} />
                      </div>

                      <h3
                        className={`text-3xl font-display text-white ${styles.textHover} transition-colors`}
                      >
                        {card.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-base mb-6">{card.description}</p>

                    <div
                      className={`mt-auto flex items-center text-sm font-medium ${styles.text} opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300`}
                    >
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
