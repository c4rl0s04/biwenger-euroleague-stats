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
  // 1. Extract all unique teams currently playing or mentioned in the schedule
  const teams = useMemo(() => {
    const teamsMap = new Map();
    matches.forEach((m) => {
      if (m.home) teamsMap.set(m.home.id, { ...m.home, role: 'home', match: m });
      if (m.away) teamsMap.set(m.away.id, { ...m.away, role: 'away', match: m });
    });
    return Array.from(teamsMap.values());
  }, [matches]);

  // 2. Group these teams by their TARGET venue (proximity based)
  const groupedVenues = useMemo(() => {
    const groups = [];
    const PROXIMITY_THRESHOLD = 0.5;

    teams.forEach((team) => {
      // Use the venue address (the HOME team's coords for this match)
      const targetLat = team.role === 'home' ? team.latitude : team.match.home.latitude;
      const targetLng = team.role === 'home' ? team.longitude : team.match.home.longitude;

      let foundGroup = false;
      for (const group of groups) {
        const firstMember = group[0];
        const groupLat =
          firstMember.role === 'home' ? firstMember.latitude : firstMember.match.home.latitude;
        const groupLng =
          firstMember.role === 'home' ? firstMember.longitude : firstMember.match.home.longitude;

        const distLat = Math.abs(targetLat - groupLat);
        const distLng = Math.abs(targetLng - groupLng);

        if (distLat < PROXIMITY_THRESHOLD && distLng < PROXIMITY_THRESHOLD) {
          group.push(team);
          foundGroup = true;
          break;
        }
      }

      if (!foundGroup) {
        groups.push([team]);
      }
    });

    return groups;
  }, [teams]);

  // Calculate bounds to fit all markers
  const bounds = useMemo(() => {
    const activeCoords = teams.map((t) => ({
      lat: t.role === 'home' ? t.latitude : t.match.home.latitude,
      lng: t.role === 'home' ? t.longitude : t.match.home.longitude,
    }));

    if (activeCoords.length === 0) return null;
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;
    activeCoords.forEach((c) => {
      if (c.lng < minLng) minLng = c.lng;
      if (c.lat < minLat) minLat = c.lat;
      if (c.lng > maxLng) maxLng = c.lng;
      if (c.lat > maxLat) maxLat = c.lat;
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
  }, [teams]);

  return (
    <div className="w-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 relative h-[600px]">
      <MapComponent bounds={bounds} padding={50} className="h-full w-full">
        <MapControls position="bottom-right" />

        {groupedVenues.map((group, groupIdx) => {
          // Identify matches in this location
          const groupMatches = new Map();
          group.forEach((t) => groupMatches.set(t.match.id, t.match));
          const sessionMatches = Array.from(groupMatches.values());

          return sessionMatches.map((match, idx) => {
            const { latitude, longitude, code, id, name, img: homeImg } = match.home;
            const { name: awayName, img: awayImg, code: awayCode } = match.away || {};
            const teamColor = getTeamColor(code);

            // Alternate label position for regional collisions
            const isAlternate = idx % 2 === 1;

            return (
              <TeamMarker
                key={`${id}-${match.id}`}
                longitude={longitude}
                latitude={latitude}
                // Delay based on index for "wave" effect
                delay={idx * 150}
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

                    {/* Invisible Hit Bridge */}
                    <div
                      className={cn(
                        'absolute w-20 h-20 -z-10 bg-transparent',
                        isAlternate ? 'bottom-0' : 'top-0'
                      )}
                    />

                    {/* Persistent Tag (Logos) */}
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
                      <img src={awayImg} alt={awayCode} className="w-5 h-5 object-contain" />
                    </div>

                    {/* Hover Tooltip */}
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
              </TeamMarker>
            );
          });
        })}
      </MapComponent>
    </div>
  );
}
