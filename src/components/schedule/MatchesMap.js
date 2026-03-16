'use client';

import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

export default function MatchesMap({ matches = [] }) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  const venuesWithCoords = matches.filter((m) => m.home?.latitude && m.home?.longitude);

  useEffect(() => {
    if (map.current) return;

    // Initialize map with a very basic style
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: {
        version: 8,
        sources: {
          osm: {
            type: 'raster',
            tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
            tileSize: 256,
            attribution: '© OpenStreetMap contributors',
          },
        },
        layers: [
          {
            id: 'osm-layer',
            type: 'raster',
            source: 'osm',
          },
        ],
      },
      center: [10, 45],
      zoom: 3,
    });

    map.current.on('load', () => setMapLoaded(true));

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers manually by tracking them or just clearing the DOM if simple
    const container = mapContainer.current;
    const existingMarkers = container.querySelectorAll('.maplibregl-marker');
    existingMarkers.forEach((m) => m.remove());

    if (venuesWithCoords.length === 0) return;

    const bounds = new maplibregl.LngLatBounds();

    venuesWithCoords.forEach((match) => {
      const { latitude, longitude } = match.home;

      // Use default marker
      new maplibregl.Marker().setLngLat([longitude, latitude]).addTo(map.current);

      bounds.extend([longitude, latitude]);
    });

    // Skip animation, just jump to bounds
    map.current.fitBounds(bounds, { padding: 40, maxZoom: 5, animate: false });
  }, [venuesWithCoords, mapLoaded]);

  return (
    <div className="w-full bg-zinc-900 rounded-xl overflow-hidden border border-zinc-800 relative min-h-[400px]">
      <div ref={mapContainer} className="absolute inset-0 w-full h-full" />

      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-zinc-900 text-zinc-500 text-sm">
          Cargando mapa...
        </div>
      )}
    </div>
  );
}
