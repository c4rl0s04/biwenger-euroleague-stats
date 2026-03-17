import React, { useMemo } from 'react';
import { Map as MapComponent, MapControls, MarkerContent } from '@/components/ui/map';
import { getTeamColor } from '@/lib/constants/teamColors';
import { cn } from '@/lib/utils';
import { TeamMarker } from './TeamMarker';
import { formatMatchDateShort, formatMatchTime } from '@/lib/utils/date';

/**
 * NormalMarker Component
 * Individual venue marker for standard round view mode.
 */
function NormalMarker({ match, isAlternate }) {
  const { img: homeImg, code, name } = match.home;
  const { img: awayImg, code: awayCode, name: awayName } = match.away || {};
  const teamColor = getTeamColor(code);

  return (
    <TeamMarker longitude={match.home.longitude} latitude={match.home.latitude}>
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
            style={{ backgroundColor: teamColor }}
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
            <img src={homeImg} alt={code} className="w-5 h-5 object-contain" />
            <span className="text-[8px] font-black text-zinc-500 uppercase leading-none tracking-tighter">
              vs
            </span>
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
                {formatMatchDateShort(match.date)}
              </span>
              <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg uppercase tracking-wider">
                {formatMatchTime(match.date)}
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <img src={homeImg} className="w-6 h-6 object-contain" alt="" />
                <span className="text-sm font-bold truncate tracking-tight">{name}</span>
              </div>
              <div className="flex items-center gap-3 opacity-60">
                <img src={awayImg} className="w-6 h-6 object-contain" alt="" />
                <span className="text-sm font-medium truncate tracking-tight">{awayName}</span>
              </div>
            </div>
          </div>
        </div>
      </MarkerContent>
    </TeamMarker>
  );
}

/**
 * TourMarker Component
 * Individual stop marker for European Tour mode.
 */
function TourMarker({ venue, selectedTeamId }) {
  const { latitude, longitude, code, img: homeImg, match, sequence } = venue;
  const { img: awayImg, name: awayName } = match.away || {};
  const teamColor = getTeamColor(code);
  const isAway = match.away?.id === selectedTeamId;
  const isFinished = match.status === 'finished';

  const homeScore = match.home?.score ?? match.home_score;
  const awayScore = match.away?.score ?? match.away_score;

  return (
    <TeamMarker longitude={longitude} latitude={latitude}>
      <MarkerContent>
        <div
          className="group relative pointer-events-auto cursor-pointer flex flex-col items-center"
          style={{ zIndex: '10' }}
          onMouseEnter={(e) => {
            const markerEl = e.currentTarget.closest('.maplibregl-marker');
            if (markerEl) markerEl.style.zIndex = '1000';
          }}
          onMouseLeave={(e) => {
            const markerEl = e.currentTarget.closest('.maplibregl-marker');
            if (markerEl) markerEl.style.zIndex = '';
          }}
        >
          {/* Sequence Badge */}
          <div className="bg-blue-600 text-white text-[11px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-lg border-2 border-zinc-900 z-20 transition-transform group-hover:scale-110 mb-[-4px] relative">
            {sequence}
          </div>

          <div
            className="pin-circle w-4 h-4 rounded-full border-2 border-white shadow-xl relative z-10"
            style={{ backgroundColor: teamColor }}
          />

          <div className="absolute top-[calc(100%+4px)] left-1/2 -translate-x-1/2 bg-zinc-950/40 p-1 rounded-lg backdrop-blur-md z-10 transition-all min-w-max group-hover:bg-zinc-900/60">
            <img src={homeImg} alt="" className="w-6 h-6 object-contain" />
          </div>

          {/* Enhanced Tooltip */}
          <div className="absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 bg-zinc-950 border border-zinc-800 p-3 rounded-2xl text-white min-w-[220px] opacity-0 group-hover:opacity-100 transition-all transform translate-y-2 group-hover:translate-y-0 pointer-events-none z-[1100] shadow-[0_20px_50px_rgba(0,0,0,0.5)] ring-1 ring-white/10">
            <div className="flex justify-between items-center gap-4 mb-3 pb-2.5 border-b border-zinc-900">
              <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-tighter">
                {formatMatchDateShort(match.date)}
              </span>
              {isFinished ? (
                <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg uppercase tracking-wider">
                  Finalizado
                </span>
              ) : (
                <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg uppercase tracking-wider">
                  {formatMatchTime(match.date)}
                </span>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={homeImg} className="w-5 h-5 object-contain" alt="" />
                  <span
                    className={cn(
                      'text-xs font-bold truncate',
                      isAway ? 'opacity-60' : 'text-blue-400'
                    )}
                  >
                    {match.home.name}
                  </span>
                </div>
                {isFinished && <span className="text-xs font-black">{homeScore}</span>}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <img src={awayImg} className="w-5 h-5 object-contain" alt="" />
                  <span
                    className={cn(
                      'text-xs font-bold truncate',
                      !isAway ? 'opacity-60' : 'text-blue-400'
                    )}
                  >
                    {awayName}
                  </span>
                </div>
                {isFinished && <span className="text-xs font-black">{awayScore}</span>}
              </div>
            </div>
          </div>
        </div>
      </MarkerContent>
    </TeamMarker>
  );
}

/**
 * MatchesMap Component
 * Orchestrates the visualization of matches on a map, supporting both standard round view
 * and a team-specific European Tour mode.
 * @param {Object} props - Component props
 * @param {Array} props.matches - List of matches to display
 * @param {number|string} props.selectedTeamId - ID of the selected team for Tour Mode
 */
export default function MatchesMap({ matches = [], selectedTeamId = null }) {
  const isTourMode = selectedTeamId !== null;

  // Process venues and bounds...
  const tourVenues = useMemo(() => {
    if (!isTourMode) return [];
    return matches.map((m, idx) => ({
      ...m.home,
      match: m,
      sequence: idx + 1,
    }));
  }, [matches, isTourMode]);

  const teams = useMemo(() => {
    if (isTourMode) return [];
    const teamsMap = new Map();
    matches.forEach((m) => {
      if (m.home) teamsMap.set(m.home.id, { ...m.home, role: 'home', match: m });
      if (m.away) teamsMap.set(m.away.id, { ...m.away, role: 'away', match: m });
    });
    return Array.from(teamsMap.values());
  }, [matches, isTourMode]);

  const groupedVenues = useMemo(() => {
    if (isTourMode) return [];
    const groups = [];
    const PROXIMITY_THRESHOLD = 0.5;

    teams.forEach((team) => {
      const targetLat = team.role === 'home' ? team.latitude : team.match.home.latitude;
      const targetLng = team.role === 'home' ? team.longitude : team.match.home.longitude;

      let foundGroup = false;
      for (const group of groups) {
        const firstMember = group[0];
        const groupLat =
          firstMember.role === 'home' ? firstMember.latitude : firstMember.match.home.latitude;
        const groupLng =
          firstMember.role === 'home' ? firstMember.longitude : firstMember.match.home.longitude;

        if (
          Math.abs(targetLat - groupLat) < PROXIMITY_THRESHOLD &&
          Math.abs(targetLng - groupLng) < PROXIMITY_THRESHOLD
        ) {
          group.push(team);
          foundGroup = true;
          break;
        }
      }
      if (!foundGroup) groups.push([team]);
    });
    return groups;
  }, [teams, isTourMode]);

  const bounds = useMemo(() => {
    const coords = isTourMode
      ? tourVenues.map((v) => ({ lat: v.latitude, lng: v.longitude }))
      : teams.map((t) => ({
          lat: t.role === 'home' ? t.latitude : t.match.home.latitude,
          lng: t.role === 'home' ? t.longitude : t.match.home.longitude,
        }));

    if (coords.length === 0) return null;
    let minLng = Infinity,
      minLat = Infinity,
      maxLng = -Infinity,
      maxLat = -Infinity;
    coords.forEach((c) => {
      minLng = Math.min(minLng, c.lng);
      minLat = Math.min(minLat, c.lat);
      maxLng = Math.max(maxLng, c.lng);
      maxLat = Math.max(maxLat, c.lat);
    });

    if (minLng === maxLng)
      return [
        [minLng - 0.01, minLat - 0.01],
        [maxLng + 0.01, maxLat + 0.01],
      ];
    return [
      [minLng, minLat],
      [maxLng, maxLat],
    ];
  }, [teams, tourVenues, isTourMode]);

  return (
    <div className="w-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 relative h-[600px]">
      <MapComponent bounds={bounds} padding={50} className="h-full w-full">
        <MapControls position="bottom-right" />

        {!isTourMode &&
          groupedVenues.map((group) => {
            const groupMatches = Array.from(
              new Map(group.map((t) => [t.match.id, t.match])).values()
            );
            return groupMatches.map((match, idx) => (
              <NormalMarker key={`${match.id}`} match={match} isAlternate={idx % 2 === 1} />
            ));
          })}

        {isTourMode &&
          tourVenues.map((venue) => (
            <TourMarker
              key={`tour-${venue.match.id}`}
              venue={venue}
              selectedTeamId={selectedTeamId}
            />
          ))}
      </MapComponent>
    </div>
  );
}
