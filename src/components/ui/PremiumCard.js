'use client';

import { useCardTheme } from '@/contexts/CardThemeContext';
import StandardCard from './card-variants/StandardCard';
import GlassCard from './card-variants/GlassCard';
import MeshCard from './card-variants/MeshCard';
import NeoCard from './card-variants/NeoCard';

export default function PremiumCard(props) {
  // Use try/catch or default because this component might be used 
  // outside the provider during initial render/hydration
  // (Resolved build error refresh)
  let theme = 'standard';
  try {
    const context = useCardTheme();
    if (context) theme = context.theme;
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
