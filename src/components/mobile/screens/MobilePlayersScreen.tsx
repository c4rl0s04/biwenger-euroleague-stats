'use client';

import { Filter, Search, SlidersHorizontal, Sparkles, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import MobileBottomSheet from '../MobileBottomSheet';
import {
  MobileListRow,
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '../MobileScreen';

type Player = Record<string, any>;

export default function MobilePlayersScreen({
  players,
  query = '',
  position = '',
}: {
  players: Player[];
  query?: string;
  position?: string;
}) {
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [draftQuery, setDraftQuery] = useState(query);
  const [draftPosition, setDraftPosition] = useState(position);

  const applyFilters = (event: FormEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    if (draftQuery.trim()) params.set('q', draftQuery.trim());
    if (draftPosition) params.set('position', draftPosition);
    router.push(`/players${params.size ? `?${params}` : ''}`);
    setFiltersOpen(false);
  };

  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader eyebrow="Scouting" title="Jugadores" description={`${players.length} resultados`} />

      <div className="mobile-player-toolbar">
        <form onSubmit={applyFilters} role="search">
          <Search size={18} aria-hidden="true" />
          <label className="sr-only" htmlFor="mobile-player-search">Buscar jugadores</label>
          <input id="mobile-player-search" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} placeholder="Nombre o equipo" autoComplete="off" />
        </form>
        <button type="button" onClick={() => setFiltersOpen(true)} aria-label="Abrir filtros" className={position ? 'mobile-filter-active' : undefined}>
          <SlidersHorizontal size={19} aria-hidden="true" />
        </button>
      </div>

      {(query || position) && (
        <div className="mobile-active-filters" aria-label="Filtros activos">
          {query && <span>“{query}”</span>}
          {position && <span>{position}</span>}
        </div>
      )}

      <MobileSectionHeading>Resultados</MobileSectionHeading>
      <div>
        {players.slice(0, 60).map((player) => (
          <MobileListRow
            key={String(player.id)}
            href={`/player/${player.id}`}
            leading={<span className="mobile-position-chip">{player.position ?? '—'}</span>}
            title={player.name}
            subtitle={`${player.team_name ?? player.team ?? 'Sin equipo'} · ${player.owner_name ?? 'Libre'}`}
            trailing={<span className="mobile-player-points">{Number(player.avg_points ?? player.season_avg ?? 0).toLocaleString('es-ES')}</span>}
          />
        ))}
      </div>

      <MobileSectionHeading>Más análisis</MobileSectionHeading>
      <div>
        <MobileSectionLink href="/players/insights" title="Insights" description="Forma, valor y oportunidades" icon={Sparkles} />
        <MobileSectionLink href="/players/squads" title="Plantillas" description="Distribución por mánager y posición" icon={Users} accent="blue" />
      </div>

      <MobileBottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="Filtrar jugadores" description="Ajusta la lista sin perder tu posición">
        <form onSubmit={applyFilters} className="mobile-filter-form">
          <label htmlFor="mobile-filter-name">Nombre o equipo</label>
          <input id="mobile-filter-name" value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} />
          <fieldset>
            <legend>Posición</legend>
            <div className="mobile-filter-options">
              {['', 'Base', 'Escolta', 'Alero', 'Ala-pívot', 'Pívot'].map((option) => (
                <label key={option || 'all'}>
                  <input type="radio" name="position" value={option} checked={draftPosition === option} onChange={(event) => setDraftPosition(event.target.value)} />
                  <span>{option || 'Todas'}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" className="mobile-primary-action"><Filter size={18} aria-hidden="true" /> Aplicar filtros</button>
        </form>
      </MobileBottomSheet>
    </MobileScreen>
  );
}
