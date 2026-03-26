'use client';

import { useState, useMemo } from 'react';
import Section from '@/components/layout/Section';
import PlayerStatsSection from './PlayerStatsSection';
import PlayerFilters from './PlayerFilters';
import PlayerList from './PlayerList';

export default function PlayersDiscovery({ initialPlayers = [] }) {
  // --- STATE ---
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');
  const [ownerFilter, setOwnerFilter] = useState('ALL');
  const [positionFilter, setPositionFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [sortConfig, setSortConfig] = useState({ key: 'total_points', direction: 'desc' });
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [maxPrice, setMaxPrice] = useState('');
  const ITEMS_PER_PAGE = 24;

  // --- DATA DERIVATION ---
  const teams = useMemo(() => {
    const uniqueTeams = {};
    initialPlayers.forEach((p) => {
      if (p.team_id && !uniqueTeams[p.team_id]) {
        uniqueTeams[p.team_id] = {
          id: p.team_id,
          name: p.team_name,
          img: p.team_img,
        };
      }
    });
    return Object.values(uniqueTeams).sort((a, b) => a.name.localeCompare(b.name));
  }, [initialPlayers]);

  const owners = useMemo(() => {
    const uniqueOwners = {};
    initialPlayers.forEach((p) => {
      if (p.owner_id && !uniqueOwners[p.owner_id]) {
        uniqueOwners[p.owner_id] = {
          id: p.owner_id,
          name: p.owner_name,
        };
      }
    });
    return Object.values(uniqueOwners).sort((a, b) => a.name.localeCompare(b.name));
  }, [initialPlayers]);

  // --- FILTERING LOGIC ---
  const filteredPlayers = useMemo(() => {
    let result = [...initialPlayers];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) => p.name?.toLowerCase().includes(q) || p.team?.name?.toLowerCase().includes(q)
      );
    }

    if (teamFilter !== 'ALL') {
      result = result.filter((p) => String(p.team_id) === teamFilter);
    }

    if (ownerFilter !== 'ALL') {
      result = result.filter((p) => String(p.owner_id) === ownerFilter);
    }

    if (positionFilter !== 'ALL') {
      result = result.filter((p) => p.position === positionFilter);
    }

    if (statusFilter !== 'ALL') {
      if (statusFilter === 'OWNED') {
        result = result.filter((p) => p.owner_id && p.owner_id !== 0);
      } else if (statusFilter === 'FREE') {
        result = result.filter((p) => !p.owner_id || p.owner_id === 0);
      }
    }

    if (maxPrice) {
      result = result.filter((p) => p.price <= parseInt(maxPrice));
    }

    // Sort
    result.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];

      if (sortConfig.key === 'name') {
        aVal = aVal?.toLowerCase() || '';
        bVal = bVal?.toLowerCase() || '';
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [
    initialPlayers,
    search,
    teamFilter,
    ownerFilter,
    positionFilter,
    statusFilter,
    sortConfig,
    maxPrice,
  ]);

  // --- PAGINATION ---
  const totalPages = Math.ceil(filteredPlayers.length / ITEMS_PER_PAGE);
  const displayPlayers = filteredPlayers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc',
    }));
    setCurrentPage(1);
  };

  return (
    <div className="w-full">
      {/* SECTION 1: ESTADÍSTICAS */}
      <Section title="Estadísticas" background="section-base" delay={0}>
        <PlayerStatsSection filteredPlayers={filteredPlayers} />
      </Section>

      {/* SECTION 2: PLAYERS */}
      <Section title="Players" background="section-raised" delay={100}>
        <PlayerFilters
          search={search}
          setSearch={setSearch}
          teamFilter={teamFilter}
          setTeamFilter={setTeamFilter}
          ownerFilter={ownerFilter}
          setOwnerFilter={setOwnerFilter}
          positionFilter={positionFilter}
          setPositionFilter={setPositionFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          viewMode={viewMode}
          setViewMode={setViewMode}
          maxPrice={maxPrice}
          setMaxPrice={setMaxPrice}
          teams={teams}
          owners={owners}
          handleSort={handleSort}
          setCurrentPage={setCurrentPage}
        />

        <PlayerList
          players={displayPlayers}
          viewMode={viewMode}
          currentPage={currentPage}
          totalPages={totalPages}
          setCurrentPage={setCurrentPage}
        />
      </Section>
    </div>
  );
}
