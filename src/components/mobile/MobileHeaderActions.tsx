'use client';

import { LogIn, LogOut, Search, Settings, UserCircle2, X } from 'lucide-react';
import { signOut } from 'next-auth/react';
import { useState, type ComponentType } from 'react';

import SearchDropdown from '@/components/layout/SearchDropdown';
import { NavigationLink } from '@/components/layout/NavigationFeedback';
import { UserAvatar } from '@/components/ui';
import { useClientUser } from '@/lib/hooks/useClientUser';

import MobileBottomSheet from './MobileBottomSheet';

interface MobileHeaderUser {
  id: string | number;
  name: string;
  icon?: string | null;
}

const MobileUserAvatar = UserAvatar as unknown as ComponentType<{
  src?: string | null;
  alt: string;
  size?: number;
}>;

export default function MobileHeaderActions() {
  const [activeSheet, setActiveSheet] = useState<'search' | 'profile' | null>(null);
  const { currentUser, isAuthenticated, isClient } = useClientUser() as unknown as {
    currentUser: MobileHeaderUser | null;
    isAuthenticated: boolean;
    isClient: boolean;
  };

  const closeSheet = () => setActiveSheet(null);
  const activeUser = isClient ? currentUser : null;
  const activeAuthenticated = Boolean(isClient && isAuthenticated);
  const profileName = activeUser?.name ?? 'Perfil';

  return (
    <div className="mobile-native-header-actions">
      <button
        type="button"
        className="mobile-native-icon-button"
        onClick={() => setActiveSheet('search')}
        aria-label="Abrir búsqueda"
        aria-expanded={activeSheet === 'search'}
        aria-haspopup="dialog"
      >
        <Search size={20} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="mobile-native-avatar"
        onClick={() => setActiveSheet('profile')}
        aria-label="Abrir perfil"
        aria-expanded={activeSheet === 'profile'}
        aria-haspopup="dialog"
      >
        {activeUser ? (
          <MobileUserAvatar src={activeUser.icon} alt={profileName} size={28} />
        ) : (
          <UserCircle2 size={23} aria-hidden="true" />
        )}
      </button>
      <MobileBottomSheet
        open={activeSheet === 'search'}
        onClose={closeSheet}
        title="Buscar"
        description="Jugadores, equipos y mánagers"
      >
        <div className="mobile-search-sheet-content">
          <SearchDropdown onClose={closeSheet} />
          <button type="button" className="mobile-sheet-secondary-action" onClick={closeSheet}>
            <X size={18} aria-hidden="true" /> Cerrar búsqueda
          </button>
        </div>
      </MobileBottomSheet>
      <MobileBottomSheet
        open={activeSheet === 'profile'}
        onClose={closeSheet}
        title="Cuenta"
        description={activeAuthenticated ? 'Sesión de mánager' : 'Accede a tu liga'}
      >
        <div className="mobile-account-sheet-content">
          <div className="mobile-account-identity">
            {activeUser ? (
              <MobileUserAvatar src={activeUser.icon} alt={profileName} size={52} />
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
