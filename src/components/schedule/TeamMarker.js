'use client';

import { useEffect, useRef } from 'react';
import { useMotionValue, useSpring, animate } from 'framer-motion';
import { MapMarker, MarkerContent } from '@/components/ui/map';

export function TeamMarker({ longitude, latitude, children, delay = 0, onHoverStart, onHoverEnd }) {
  const markerRef = useRef(null);

  // Create motion values for smooth interpolation
  const mLong = useMotionValue(longitude);
  const mLat = useMotionValue(latitude);

  // Use springs for a natural "gliding" feel
  const springConfig = { damping: 30, stiffness: 200, restDelta: 0.0001 };
  const sLong = useSpring(mLong, springConfig);
  const sLat = useSpring(mLat, springConfig);

  // When props change, animate the motion values
  useEffect(() => {
    const controlsLong = animate(mLong, longitude, {
      duration: 1.5,
      ease: [0.34, 1.56, 0.64, 1], // Custom overshoot ease
      delay: delay / 1000,
    });
    const controlsLat = animate(mLat, latitude, {
      duration: 1.5,
      ease: [0.34, 1.56, 0.64, 1],
      delay: delay / 1000,
    });

    return () => {
      controlsLong.stop();
      controlsLat.stop();
    };
  }, [longitude, latitude, delay, mLong, mLat]);

  // Sync the MapLibre marker position with the spring values
  useEffect(() => {
    const unsubLong = sLong.on('change', (v) => {
      if (markerRef.current) {
        const currentLat = sLat.get();
        markerRef.current.setLngLat([v, currentLat]);
      }
    });
    const unsubLat = sLat.on('change', (v) => {
      if (markerRef.current) {
        const currentLong = sLong.get();
        markerRef.current.setLngLat([currentLong, v]);
      }
    });

    return () => {
      unsubLong();
      unsubLat();
    };
  }, [sLong, sLat]);

  return (
    <MapMarker ref={markerRef} longitude={longitude} latitude={latitude}>
      <div onMouseEnter={onHoverStart} onMouseLeave={onHoverEnd} className="pointer-events-auto">
        {children}
      </div>
    </MapMarker>
  );
}
