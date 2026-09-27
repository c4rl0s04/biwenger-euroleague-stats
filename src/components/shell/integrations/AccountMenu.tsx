'use client';

import { useState } from 'react';
import { ChevronDown, UserCircle2, LogOut, LogIn } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { Avatar } from '@/components/ui/foundation';
import { useClientUser } from '@/lib/hooks/useClientUser';
import { NavigationLink } from '../shared/NavigationFeedback';

export interface AccountMenuProps {
  className?: string;
}

export interface CurrentUser {
  id: string | number;
  name: string;
  icon?: string | null;
}

export interface ClientUserState {
  currentUser: CurrentUser | null;
  isClient: boolean;
  isAuthenticated: boolean;
  isReady?: boolean;
}

export function AccountMenu({ className = '' }: AccountMenuProps) {
  const { currentUser, isClient, isAuthenticated } = useClientUser() as ClientUserState;
  const [isOpen, setIsOpen] = useState(false);

  // Guard against SSR / client hydration discrepancies (prevents React #418)
  if (!isClient) {
    return null;
  }

  if (!isAuthenticated) {
    return (
      <NavigationLink
        href="/login"
        navigationLabel="Acceso Manager"
        className={`flex items-center gap-2 px-3 sm:px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl transition-all shadow-md active:scale-95 group font-medium text-xs uppercase tracking-wider ${className}`}
      >
        <LogIn className="w-4 h-4" />
        <span className="hidden sm:inline">Acceso Manager</span>
      </NavigationLink>
    );
  }

  if (!currentUser) {
    return null;
  }

  return (
    <div className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="shell-action touch-target flex items-center gap-2 px-2.5 sm:px-3 py-1.5 bg-card/60 hover:bg-secondary border border-border/60 rounded-xl transition-all cursor-pointer group"
        aria-label={isOpen ? 'Cerrar perfil' : 'Abrir perfil'}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <Avatar
          src={currentUser.icon || undefined}
          alt={currentUser.name}
          fallback={currentUser.name}
          size="sm"
          className="ring-1 ring-border group-hover:ring-primary/50 transition-all"
        />
        <span className="text-foreground text-xs sm:text-sm hidden sm:block font-medium tracking-tight truncate max-w-[120px]">
          {currentUser.name}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-300 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[60]" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-2xl shadow-2xl z-[70] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-4 py-3 bg-secondary/50 border-b border-border/40">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-0.5">
                Sesión de Manager
              </p>
              <p className="text-sm font-bold text-foreground truncate">{currentUser.name}</p>
            </div>

            <div className="p-1.5 space-y-0.5">
              <NavigationLink
                href={`/user/${currentUser.id}`}
                navigationLabel="Perfil"
                onClick={() => setIsOpen(false)}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-secondary text-foreground transition-colors text-left rounded-xl group text-sm font-medium"
              >
                <div className="p-1.5 rounded-lg bg-secondary text-muted-foreground group-hover:text-primary transition-colors">
                  <UserCircle2 size={16} />
                </div>
                <span>Ver Perfil</span>
              </NavigationLink>

              <div className="h-px bg-border/40 my-1 mx-1.5" />

              <button
                type="button"
                onClick={async () => {
                  setIsOpen(false);
                  await signOut({ redirect: false });
                  window.location.href = '/';
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors text-left rounded-xl group cursor-pointer text-sm font-medium"
              >
                <div className="p-1.5 rounded-lg bg-secondary text-muted-foreground group-hover:text-destructive transition-colors">
                  <LogOut size={16} />
                </div>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default AccountMenu;
