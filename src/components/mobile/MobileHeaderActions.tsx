'use client';

import { Search, X } from 'lucide-react';
import { useState } from 'react';

import { UserSelector } from '@/components/user';
import SearchDropdown from '@/components/layout/SearchDropdown';

import MobileBottomSheet from './MobileBottomSheet';

export default function MobileHeaderActions() {
  const [searchOpen, setSearchOpen] = useState(false);

  return (
    <div className="mobile-native-header-actions">
      <button
        type="button"
        className="mobile-native-icon-button"
        onClick={() => setSearchOpen(true)}
        aria-label="Abrir búsqueda"
      >
        <Search size={20} aria-hidden="true" />
      </button>
      <div className="mobile-native-avatar">
        <UserSelector />
      </div>
      <MobileBottomSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Buscar"
        description="Jugadores, equipos y mánagers"
      >
        <div className="mobile-search-sheet-content">
          <SearchDropdown onClose={() => setSearchOpen(false)} />
          <button type="button" className="mobile-sheet-secondary-action" onClick={() => setSearchOpen(false)}>
            <X size={18} aria-hidden="true" /> Cerrar búsqueda
          </button>
        </div>
      </MobileBottomSheet>
    </div>
  );
}
