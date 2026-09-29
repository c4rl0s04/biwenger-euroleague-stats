'use client';

import { LogIn, LogOut, Search, Settings, UserCircle2 } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState, useRef } from 'react';

import { GlobalSearch } from '@/components/shell/integrations/GlobalSearch';
import { NavigationLink } from '@/components/shell/shared/NavigationFeedback';
import { Avatar, IconButton } from '@/components/ui/foundation';
import MobileBottomSheet from '@/components/mobile/MobileBottomSheet';
import { useClientUser } from '@/lib/hooks/useClientUser';

export default function MobileHeaderActions() {
  const [activeSheet, setActiveSheet] = useState<'search' | 'profile' | null>(null);
  const { currentUser, isAuthenticated, isClient } = useClientUser();

  const searchTriggerRef = useRef<HTMLButtonElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const profileTriggerRef = useRef<HTMLButtonElement>(null);

  const closeSheet = () => setActiveSheet(null);
  const activeUser = isClient ? currentUser : null;
  const activeAuthenticated = Boolean(isClient && isAuthenticated);
  const profileName = activeUser?.name ?? 'Perfil';

  return (
    <div className="mobile-native-header-actions">
      <IconButton
        ref={searchTriggerRef}
        className="mobile-native-icon-button"
        onClick={() => setActiveSheet('search')}
        aria-label="Abrir búsqueda"
        aria-expanded={activeSheet === 'search'}
        aria-haspopup="dialog"
      >
        <Search size={20} aria-hidden="true" />
      </IconButton>
      <IconButton
        ref={profileTriggerRef}
        className="mobile-native-avatar w-12"
        onClick={() => setActiveSheet('profile')}
        aria-label="Abrir perfil"
        aria-expanded={activeSheet === 'profile'}
        aria-haspopup="dialog"
      >
        {activeUser ? (
          <Avatar
            src={activeUser.icon}
            alt=""
            size="sm"
            fallback={profileName.charAt(0).toUpperCase()}
            className="h-7 w-7 border-0 bg-[hsl(var(--surface-muted))] text-[hsl(var(--content-muted))]"
          />
        ) : (
          <UserCircle2 size={23} aria-hidden="true" />
        )}
      </IconButton>
      <MobileBottomSheet
        open={activeSheet === 'search'}
        initialFocusRef={searchInputRef}
        returnFocusRef={searchTriggerRef}
        onClose={closeSheet}
        title="Buscar"
        description="Jugadores, equipos y mánagers"
        variant="search"
      >
        <div className="mobile-search-sheet-content">
          <GlobalSearch inputRef={searchInputRef} onClose={closeSheet} presentation="sheet" />
        </div>
      </MobileBottomSheet>
      <MobileBottomSheet
        open={activeSheet === 'profile'}
        returnFocusRef={profileTriggerRef}
        onClose={closeSheet}
        title="Cuenta"
        description={activeAuthenticated ? 'Sesión de mánager' : 'Accede a tu liga'}
      >
        <div className="mobile-account-sheet-content">
          <div className="mobile-account-identity">
            {activeUser ? (
              <Avatar
                src={activeUser.icon}
                alt={profileName}
                size="lg"
                fallback={profileName.charAt(0).toUpperCase()}
                className="h-[52px] w-[52px] border-0 bg-[hsl(var(--surface-muted))] text-[hsl(var(--content-muted))]"
              />
            ) : (
              <span className="mobile-account-avatar-fallback">
                <UserCircle2 size={28} aria-hidden="true" />
              </span>
            )}
            <div>
              <span>{activeAuthenticated ? 'Manager conectado' : 'Sin sesión'}</span>
              <strong>{profileName}</strong>
            </div>
          </div>

          {activeAuthenticated && activeUser ? (
            <>
              <NavigationLink
                href={`/user/${activeUser.id}`}
                navigationLabel="Perfil"
                onClick={closeSheet}
                className="mobile-account-action"
              >
                <UserCircle2 size={20} aria-hidden="true" />
                <span>Ver perfil</span>
              </NavigationLink>
              <NavigationLink
                href="/settings"
                navigationLabel="Ajustes"
                onClick={closeSheet}
                className="mobile-account-action"
              >
                <Settings size={20} aria-hidden="true" />
                <span>Ajustes</span>
              </NavigationLink>
              <button
                type="button"
                className="mobile-account-action mobile-account-sign-out"
                onClick={async () => {
                  closeSheet();
                  await signOut({ redirect: false });
                  window.location.assign('/');
                }}
              >
                <LogOut size={20} aria-hidden="true" />
                <span>Cerrar sesión</span>
              </button>
            </>
          ) : (
            <NavigationLink
              href="/login"
              navigationLabel="Acceso Manager"
              onClick={closeSheet}
              className="mobile-account-action"
            >
              <LogIn size={20} aria-hidden="true" />
              <span>Iniciar sesión</span>
            </NavigationLink>
          )}
        </div>
      </MobileBottomSheet>
    </div>
  );
}
