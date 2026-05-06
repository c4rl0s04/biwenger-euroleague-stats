'use client';

import { useState } from 'react';
import { useClientUser } from '@/lib/hooks/useClientUser';
import { ChevronDown, UserCircle2, LogOut, LogIn } from 'lucide-react';
import { UserAvatar } from '@/components/ui';
import { signOut } from 'next-auth/react';
import Link from 'next/link';

export default function UserSelector() {
  const { currentUser, users, isClient, isAuthenticated } = useClientUser();
  const [isOpen, setIsOpen] = useState(false);

  // Don't render on server to prevent hydration mismatch
  if (!isClient) return null;

  console.log('DEBUG - UserSelector - Auth:', isAuthenticated, 'User:', currentUser?.name);

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/50 rounded-xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95 group"
      >
        <LogIn className="w-4 h-4" />
        <span className="text-xs font-bold uppercase tracking-widest">Acceso Manager</span>
      </Link>
    );
  }

  if (!currentUser) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-card/40 hover:bg-white/5 border border-white/10 rounded-xl transition-all cursor-pointer group"
      >
        <UserAvatar
          src={currentUser.icon}
          alt={currentUser.name}
          size={24}
          className="ring-1 ring-white/10 group-hover:ring-primary/50 transition-all"
        />
        <span className="text-foreground text-sm hidden sm:block font-medium tracking-tight">
          {currentUser.name}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-zinc-950 border border-white/10 rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-4 py-3 bg-white/5 border-b border-white/5">
              <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">
                {isAuthenticated ? 'Sesión de Manager' : 'Perfil Seleccionado'}
              </p>
              <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
            </div>

            <div className="p-1.5">
              <Link
                href={`/user/${currentUser.id}`}
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-white/5 text-zinc-400 hover:text-white transition-colors text-left rounded-xl group"
              >
                <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-indigo-500/20 group-hover:text-indigo-400 transition-colors">
                  <UserCircle2 size={16} />
                </div>
                <span className="text-sm font-medium">Ver Perfil</span>
              </Link>

              <div className="h-px bg-white/5 my-1.5 mx-1.5" />

              <button
                onClick={async () => {
                  setIsOpen(false);
                  await signOut({ redirect: false });
                  window.location.href = '/';
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 transition-colors text-left rounded-xl group cursor-pointer"
              >
                <div className="p-2 rounded-lg bg-zinc-900 group-hover:bg-red-500/20 transition-colors">
                  <LogOut size={16} />
                </div>
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
