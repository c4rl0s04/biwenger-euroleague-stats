'use client';

import { memo } from 'react';
import { useCardTheme } from '@/contexts/CardThemeContext';
import StandardCard from './card-variants/StandardCard';
import GlassCard from './card-variants/GlassCard';
import MeshCard from './card-variants/MeshCard';
import NeoCard from './card-variants/NeoCard';

/**
 * PremiumCard - Theme-aware card component
 * Currently uses static 'mesh' theme (configured in CardThemeContext)
 * Keeps all variants for future backend theme configuration
 */
function PremiumCard(props) {
  const { theme } = useCardTheme();

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
