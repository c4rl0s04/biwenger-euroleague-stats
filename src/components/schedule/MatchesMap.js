'use client';

import React, { useMemo } from 'react';
import { Map, MapMarker, MarkerContent, MapControls } from '@/components/ui/map';
import { getTeamColor } from '@/lib/constants/teamColors';

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
  const venuesWithCoords = useMemo(
    () => matches.filter((m) => m.home?.latitude && m.home?.longitude),
    [matches]
  );

  // Calculate bounds to fit all markers
  const bounds = useMemo(() => {
    if (venuesWithCoords.length === 0) return null;
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;
    venuesWithCoords.forEach((m) => {
      const { longitude, latitude } = m.home;
      if (longitude < minLng) minLng = longitude;
      if (latitude < minLat) minLat = latitude;
      if (longitude > maxLng) maxLng = longitude;
      if (latitude > maxLat) maxLat = latitude;
    });
    // Add a small buffer if there's only one point
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
  }, [venuesWithCoords]);

  return (
    <div className="w-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 relative h-[600px]">
      <Map bounds={bounds} padding={50} className="h-full w-full">
        <MapControls position="bottom-right" />

        {venuesWithCoords.map((match) => {
          const { latitude, longitude, code, id, name, img: homeImg } = match.home;
          const { name: awayName, img: awayImg } = match.away || {};
          const teamColor = getTeamColor(code);

          return (
            <MapMarker key={`${id}-${match.id}`} longitude={longitude} latitude={latitude}>
              <MarkerContent>
                <div
                  className="group relative cursor-pointer"
                  style={{
                    width: '16px',
                    height: '16px',
                    borderRadius: '50%',
                    backgroundColor: teamColor,
                    border: '2px solid white',
                    boxShadow: `0 0 4px rgba(0,0,0,0.5), 0 0 10px ${teamColor}66`,
                    transition: 'transform 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.3)';
                    // Bring the marker element to top in MapLibre
                    // The MarkerContent is portaled into marker.getElement()
                    // We can go up to the marker element and increase z-index
                    const markerEl = e.currentTarget.closest('.maplibregl-marker');
                    if (markerEl) markerEl.style.zIndex = '1000';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    const markerEl = e.currentTarget.closest('.maplibregl-marker');
                    if (markerEl) markerEl.style.zIndex = '';
                  }}
                >
                  {/* Persistent Label (Logos) */}
                  <div className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800/50 px-2 py-1 rounded-full shadow-lg backdrop-blur-sm z-10 pointer-events-none group-hover:bg-zinc-900 transition-colors whitespace-nowrap">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={homeImg} alt={code} className="w-3.5 h-3.5 object-contain" />
                    <span className="text-[7px] font-black text-zinc-500 uppercase leading-none">
                      vs
                    </span>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={awayImg} alt="Away" className="w-3.5 h-3.5 object-contain" />
                  </div>

                  {/* Enhanced Hover Tooltip (Detailed Info) */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 bg-zinc-950 border border-zinc-800 p-2.5 rounded-xl text-white min-w-[180px] opacity-0 group-hover:opacity-100 transition-all transform scale-95 group-hover:scale-100 group-hover:-translate-y-1 pointer-events-none z-[1001] shadow-2xl overflow-hidden ring-1 ring-white/5">
                    {/* Date/Time Header */}
                    <div className="flex justify-between items-center gap-4 mb-2 pb-2 border-b border-zinc-900">
                      <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-tighter">
                        {formatDate(match.date)}
                      </span>
                      <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded uppercase">
                        {formatTime(match.date)}
                      </span>
                    </div>

                    {/* Matchup with Logos */}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={homeImg} className="w-5 h-5 object-contain" alt="" />
                        <span className="text-xs font-bold truncate leading-none">{name}</span>
                      </div>
                      <div className="flex items-center gap-2 opacity-60">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={awayImg} className="w-5 h-5 object-contain" alt="" />
                        <span className="text-xs font-medium truncate leading-none">
                          {awayName}
                        </span>
                      </div>
                    </div>

                    {/* Venue indicator */}
                    <div className="mt-2 text-[8px] text-zinc-500 flex items-center gap-1 font-medium italic">
                      <div className="w-1 h-1 rounded-full bg-blue-500" />
                      {match.home.arenaName || 'Sede Local'}
                    </div>
                  </div>
                </div>
              </MarkerContent>
            </MapMarker>
          );
        })}
      </Map>
    </div>
  );
}
