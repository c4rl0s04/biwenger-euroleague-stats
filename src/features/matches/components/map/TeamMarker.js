'use client';

import { MapMarker } from '@/components/ui/map';

export function TeamMarker({ longitude, latitude, children }) {
  return (
    <MapMarker longitude={longitude} latitude={latitude}>
      <div className="pointer-events-auto">{children}</div>
    </MapMarker>
  );
}
