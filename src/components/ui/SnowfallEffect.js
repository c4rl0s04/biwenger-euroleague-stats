'use client';

import Snowfall from 'react-snowfall';
import { useTheme } from '@/contexts/ThemeContext';
import { useEffect, useState } from 'react';

export default function SnowfallEffect() {
  const { showSnow } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line
    setMounted(true);
  }, []);

  // Don't render if not mounted (hydration) or if user disabled it
  if (!mounted || !showSnow) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <Snowfall
        color="#ffffff"
        snowflakeCount={75}
        radius={[0.5, 2.5]}
        speed={[0.5, 2.0]}
        wind={[-0.5, 1.0]}
        style={{ zIndex: 9999 }}
      />
    </div>
  );
}
