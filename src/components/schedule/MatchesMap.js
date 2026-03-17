'use client';

import React, { useMemo } from 'react';
import { Map as MapComponent, MapControls, MarkerContent } from '@/components/ui/map';
import { getTeamColor } from '@/lib/constants/teamColors';
import { cn } from '@/lib/utils';
import { TeamMarker } from './TeamMarker';

const formatDate = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toLocaleDateString('es-ES', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'Europe/Madrid',
  });
};

const formatTime = (dateInput) => {
  if (!dateInput) return '';
  const date = new Date(dateInput);
  return date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Europe/Madrid',
  });
};

export default function MatchesMap({ matches = [] }) {
  // 1. Extract all 18 teams and their current round status
  const teams = useMemo(() => {
    const teamsMap = new Map();
    // We assume the matches array contains all teams.
    // In Euroleague, 9 matches = 18 teams.
    matches.forEach((m) => {
      if (m.home) {
        teamsMap.set(m.home.id, {
          ...m.home,
          role: 'home',
          match: m,
          isHome: true,
        });
      }
      if (m.away && m.home) {
        teamsMap.set(m.away.id, {
          ...m.away,
          role: 'away',
          match: m,
          isHome: false,
          homeVenueCoords: { lat: m.home.latitude, lng: m.home.longitude },
        });
      }
    });
    return Array.from(teamsMap.values());
  }, [matches]);

  // Handle grouping/offsetting for docking
  const teamsWithOffsets = useMemo(() => {
    const DOCK_OFFSET = 0.15; // Adjusted offset for more realistic docking

    return teams.map((team) => {
      const baseLat = team.isHome ? team.latitude : team.homeVenueCoords.lat;
      const baseLng = team.isHome ? team.longitude : team.homeVenueCoords.lng;

      // If team is Home, shift slightly left. If Away, shift slightly right.
      // This recreates the "Home vs Away" side-by-side look.
      return {
        ...team,
        displayLat: baseLat,
        displayLng: team.isHome ? baseLng - DOCK_OFFSET : baseLng + DOCK_OFFSET,
      };
    });
  }, [teams]);

  // Calculate bounds to fit all markers
  const bounds = useMemo(() => {
    if (teamsWithOffsets.length === 0) return null;
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;
    teamsWithOffsets.forEach((t) => {
      if (t.displayLng < minLng) minLng = t.displayLng;
      if (t.displayLat < minLat) minLat = t.displayLat;
      if (t.displayLng > maxLng) maxLng = t.displayLng;
      if (t.displayLat > maxLat) maxLat = t.displayLat;
    });

    if (minLng === maxLng && minLat === maxLat) {
      return [
        [minLng - 0.01, minLat - 0.01],
        [maxLng + 0.01, maxLat + 0.01],
      ];
    }
    return [
      [minLng, minLat],
      [maxLng, maxLat],
    ];
  }, [teamsWithOffsets]);

  return (
    <div className="w-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 relative h-[600px]">
      <MapComponent bounds={bounds} padding={50} className="h-full w-full">
        <MapControls position="bottom-right" />

        {teamsWithOffsets.map((team, idx) => {
          const teamColor = getTeamColor(team.code);
          const match = team.match;

          return (
            <TeamMarker
              key={team.id} // STABLE KEY - CRITICAL for animations
              longitude={team.displayLng}
              latitude={team.displayLat}
              delay={idx * 50} // Staggered entry
            >
              <MarkerContent>
                <div
                  className="group relative flex items-center justify-center pointer-events-auto cursor-pointer"
                  style={{ width: '16px', height: '16px', zIndex: '10' }}
                  onMouseEnter={(e) => {
                    const markerEl = e.currentTarget.closest('.maplibregl-marker');
                    if (markerEl) markerEl.style.zIndex = '1000';
                    const pin = e.currentTarget.querySelector('.pin-circle');
                    if (pin) pin.style.transform = 'scale(1.3)';
                  }}
                  onMouseLeave={(e) => {
                    const markerEl = e.currentTarget.closest('.maplibregl-marker');
                    if (markerEl) markerEl.style.zIndex = '';
                    const pin = e.currentTarget.querySelector('.pin-circle');
                    if (pin) pin.style.transform = 'scale(1)';
                  }}
                >
                  {/* The Active Pin Circle */}
                  <div
                    className="pin-circle absolute w-4 h-4 rounded-full border-2 border-white shadow-xl transition-transform duration-200"
                    style={{
                      backgroundColor: teamColor,
                      boxShadow: `0 0 10px ${teamColor}66`,
                    }}
                  />

                  {/* Logo Tag */}
                  <div
                    className={cn(
                      'absolute left-1/2 -translate-x-1/2 flex items-center bg-zinc-950 border border-zinc-800 p-1.5 rounded-xl shadow-2xl backdrop-blur-md z-10 transition-all ring-1 ring-white/5 group-hover:bg-zinc-900 group-hover:border-zinc-700',
                      team.isHome ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'
                    )}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={team.img} alt={team.code} className="w-6 h-6 object-contain" />
                  </div>

                  {/* VS Indicator (Only on Home teams for balance) */}
                  {team.isHome && (
                    <div className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 text-[10px] font-black text-zinc-600 opacity-20 whitespace-nowrap">
                      VS
                    </div>
                  )}

                  {/* Hover Tooltip */}
                  <div
                    className={cn(
                      'absolute left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-800 p-3 rounded-2xl text-white min-w-[200px] opacity-0 group-hover:opacity-100 transition-all transform pointer-events-none z-[1100] shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10',
                      team.isHome
                        ? 'top-[calc(100%+12px)] translate-y-2 group-hover:translate-y-0'
                        : 'bottom-[calc(100%+40px)] -translate-y-2 group-hover:-translate-y-0'
                    )}
                  >
                    <div className="flex justify-between items-center gap-4 mb-3 pb-2.5 border-b border-zinc-900">
                      <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tighter">
                        {formatDate(match.date)}
                      </span>
                      <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg uppercase tracking-wider">
                        {formatTime(match.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={team.img} className="w-6 h-6 object-contain" alt="" />
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-blue-400 uppercase leading-none mb-1">
                          {team.isHome ? 'Local' : 'Visitante'}
                        </span>
                        <span className="text-sm font-bold truncate tracking-tight">
                          {team.name}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 pt-3 border-t border-zinc-900 flex items-center gap-2 opacity-40">
                      <span className="text-[9px] font-bold uppercase text-zinc-500">vs</span>
                      <span className="text-[10px] font-medium truncate">
                        {team.isHome ? match.away.name : match.home.name}
                      </span>
                    </div>
                    <div className="mt-2 text-[8px] text-zinc-500 flex items-center gap-1 font-medium italic">
                      <div className="w-1 h-1 rounded-full bg-blue-500" />
                      {match.home.arenaName || 'Sede Local'}
                    </div>
                  </div>
                </div>
              </MarkerContent>
            </TeamMarker>
          );
        })}
      </MapComponent>
    </div>
  );
}
