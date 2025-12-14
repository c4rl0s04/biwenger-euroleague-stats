'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Trophy, Users, User, ShoppingCart, Calendar } from 'lucide-react';
import UserSelector from '@/components/user/UserSelector';

import { useCardTheme } from '@/contexts/CardThemeContext';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Clasificación', href: '/standings', icon: Trophy },
  { name: 'Alineaciones', href: '/lineups', icon: Users },
  { name: 'Jugadores', href: '/players', icon: User },
  { name: 'Mercado', href: '/market', icon: ShoppingCart },
  { name: 'Partidos', href: '/matches', icon: Calendar },
];

const navVariants = {
  standard: 'bg-slate-950/70 backdrop-blur-xl border-b border-white/5 shadow-2xl shadow-orange-900/5 support-[backdrop-filter]:bg-slate-950/70',
  glass: 'bg-slate-900/30 backdrop-blur-2xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.1)]',
  mesh: 'bg-slate-950/60 backdrop-blur-xl border-b border-indigo-500/10 shadow-lg shadow-indigo-900/5',
  neo: 'bg-[#0A0A0A] border-b-2 border-slate-800 shadow-none'
};

export default function Navbar() {
  const pathname = usePathname();
  // Safe access to theme context
  let theme = 'standard';
  try {
    const context = useCardTheme();
    if (context) theme = context.theme;
  } catch (e) {
    // Fallback if used outside provider
  }

  const navClass = navVariants[theme] || navVariants.standard;

  return (
    <nav className={`${navClass} sticky top-0 z-50 transition-all duration-700`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link href="/dashboard" className="flex-shrink-0">
              <span className="text-xl font-bold bg-gradient-to-r from-orange-500 to-red-600 bg-clip-text text-transparent">
                Biwenger Stats
              </span>
            </Link>
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                        isActive
                          ? 'bg-slate-800 text-white'
                          : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                      }`}
                    >
                      <item.icon className={`w-4 h-4 mr-2 ${isActive ? 'text-orange-500' : 'text-slate-400'}`} />
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
          
          {/* User Selector */}
          <UserSelector />
        </div>
      </div>
      
      {/* Mobile Navigation (Bottom Bar for easy access) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-950/80 backdrop-blur-xl border-t border-white/5 pb-safe z-50">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex flex-col items-center justify-center w-full h-full ${
                  isActive ? 'text-orange-500' : 'text-slate-400'
                }`}
              >
                <item.icon className="w-6 h-6" />
                <span className="text-[10px] mt-1">{item.name}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
