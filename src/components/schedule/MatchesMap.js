'use client';

import React, { useMemo } from 'react';
import { Map, MapMarker, MarkerContent, MapControls } from '@/components/ui/map';
import { getTeamColor } from '@/lib/constants/teamColors';

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
      <Map
        bounds={bounds}
        padding={50}
        className="h-full w-full"
        // mapcn by default uses Carto Dark Matter when document has .dark class
        // Our project uses .dark on <html>, so it will pick it up automatically.
      >
        <MapControls position="bottom-right" />

        {venuesWithCoords.map((match) => {
          const { latitude, longitude, code, id, name } = match.home;
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
                    e.currentTarget.style.zIndex = '50';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.zIndex = '1';
                  }}
                >
                  {/* Persistent Label (Home vs Away) */}
                  <div className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 flex items-center gap-1 bg-zinc-950/80 border border-zinc-800/50 px-1.5 py-0.5 rounded shadow-lg backdrop-blur-sm z-10 pointer-events-none group-hover:bg-zinc-900 transition-colors">
                    <span className="text-[9px] font-bold text-zinc-100 leading-none">
                      {match.home.code}
                    </span>
                    <span className="text-[8px] font-light text-zinc-500 leading-none">vs</span>
                    <span className="text-[9px] font-bold text-zinc-100 leading-none">
                      {match.away?.code}
                    </span>
                  </div>

                  {/* Enhanced Hover Tooltip (Full Names) */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-zinc-950 border border-zinc-800 px-2 py-1.5 rounded-md text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all transform group-hover:-translate-y-1 pointer-events-none z-50 shadow-2xl">
                    <div className="font-bold border-b border-zinc-800 pb-1 mb-1 text-blue-400">
                      {match.home.name}
                    </div>
                    <div className="text-[9px] text-zinc-400">vs {match.away?.name}</div>
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
