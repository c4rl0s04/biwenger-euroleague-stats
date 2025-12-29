'use client';

import { memo, useSyncExternalStore } from 'react';
import { useCardTheme } from '@/contexts/CardThemeContext';
import StandardCard from './card-variants/StandardCard';
import GlassCard from './card-variants/GlassCard';
import MeshCard from './card-variants/MeshCard';
import NeoCard from './card-variants/NeoCard';

// Subscription function for useSyncExternalStore (no-op - value never changes)
const emptySubscribe = () => () => {};

// These functions determine if we're mounted (client-side)
const getSnapshot = () => true;
const getServerSnapshot = () => false;

function PremiumCard(props) {
  // useSyncExternalStore returns false on server, true on client after hydration
  const isClient = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);

  // Use try/catch or default because this component might be used
  // outside the provider during initial render/hydration
  let theme = 'standard';
  try {
    const context = useCardTheme();
    // Only apply dynamic theme on client to prevent hydration mismatch
    if (context && isClient) theme = context.theme;
  } catch (e) {
    // Fallback to standard if context is missing
  }

  switch (theme) {
    case 'glass':
      return <GlassCard {...props} />;
    case 'mesh':
      return <MeshCard {...props} />;
    case 'neo':
      return <NeoCard {...props} />;
    case 'standard':
    default:
      return <StandardCard {...props} />;
  }
}

export default memo(PremiumCard);
