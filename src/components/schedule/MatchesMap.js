'use client';

import React, { useMemo } from 'react';
import { Map, MapMarker, MarkerContent, MapControls } from '@/components/ui/map';
import { getTeamColor } from '@/lib/constants/teamColors';
import { cn } from '@/lib/utils';

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

  // Group venues by their exact coordinates to detect collisions
  const groupedVenues = useMemo(() => {
    const groups = {};
    venuesWithCoords.forEach((match) => {
      const key = `${match.home.latitude},${match.home.longitude}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(match);
    });
    return Object.values(groups);
  }, [venuesWithCoords]);

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

        {groupedVenues.map((group) => {
          // If multiple matches in same location, we'll need to offset them slightly
          // but the user suggested tags on top/bottom, so we'll stay on same point
          // and just position labels strategically.
          return group.map((match, idx) => {
            const { latitude, longitude, code, id, name, img: homeImg } = match.home;
            const { name: awayName, img: awayImg } = match.away || {};
            const teamColor = getTeamColor(code);

            // Alternate label position for collisions
            const isAlternate = idx % 2 === 1;

            return (
              <MapMarker key={`${id}-${match.id}`} longitude={longitude} latitude={latitude}>
                <MarkerContent>
                  <div
                    className="group relative flex items-center justify-center pointer-events-auto cursor-pointer"
                    style={{
                      width: '16px',
                      height: '16px',
                      zIndex: '10',
                    }}
                    onMouseEnter={(e) => {
                      const markerEl = e.currentTarget.closest('.maplibregl-marker');
                      if (markerEl) markerEl.style.zIndex = '1000';
                      // Scale the pin circle via ref or by finding it
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

                    {/* Invisible Hit Bridge - Ensures hover isn't lost between pin and tag */}
                    <div
                      className={cn(
                        'absolute w-20 h-20 -z-10 bg-transparent',
                        isAlternate ? 'bottom-0' : 'top-0'
                      )}
                    />

                    {/* Persistent Tag (Logos) - Positioned Top or Bottom */}
                    <div
                      className={cn(
                        'absolute left-1/2 -translate-x-1/2 flex items-center gap-2 bg-zinc-950 border border-zinc-800 px-2.5 py-1.5 rounded-xl shadow-2xl backdrop-blur-md z-10 transition-all min-w-max ring-1 ring-white/5 group-hover:bg-zinc-900 group-hover:border-zinc-700',
                        isAlternate ? 'bottom-[calc(100%+8px)]' : 'top-[calc(100%+8px)]'
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={homeImg} alt={code} className="w-5 h-5 object-contain" />
                      <span className="text-[8px] font-black text-zinc-500 uppercase leading-none tracking-tighter">
                        vs
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={awayImg} alt="Away" className="w-5 h-5 object-contain" />
                    </div>

                    {/* Hover Tooltip - Positioned opposite to tag or on top if tag is on top */}
                    <div
                      className={cn(
                        'absolute left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-800 p-3 rounded-2xl text-white min-w-[200px] opacity-0 group-hover:opacity-100 transition-all transform pointer-events-none z-[1100] shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10',
                        isAlternate
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
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={homeImg} className="w-6 h-6 object-contain" alt="" />
                          <span className="text-sm font-bold truncate tracking-tight">{name}</span>
                        </div>
                        <div className="flex items-center gap-3 opacity-60">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={awayImg} className="w-6 h-6 object-contain" alt="" />
                          <span className="text-sm font-medium truncate tracking-tight">
                            {awayName}
                          </span>
                        </div>
                      </div>
                      <div className="mt-2 text-[8px] text-zinc-500 flex items-center gap-1 font-medium italic">
                        <div className="w-1 h-1 rounded-full bg-blue-500" />
                        {match.home.arenaName || 'Sede Local'}
                      </div>
                    </div>
                  </div>
                </MarkerContent>
              </MapMarker>
            );
          });
        })}
      </Map>
    </div>
  );
}
