'use client';

import { useCardTheme } from '@/contexts/CardThemeContext';

/**
 * ThemeBackground - Dynamic background based on theme
 * Currently uses static 'elegant' theme (configured in CardThemeContext)
 * Keeps all variants for future backend theme configuration
 */
export default function ThemeBackground() {
  const { theme } = useCardTheme();

  const renderBackground = () => {
    switch (theme) {
      case 'elegant':
        return (
          <div className="fixed inset-0 z-[-1] bg-background pointer-events-none overflow-hidden">
            {/* Mesh Gradient Base */}
            <div
              className="absolute inset-0 opacity-40 mix-blend-soft-light"
              style={{ backgroundImage: 'var(--gradient-mesh)', backgroundSize: '100% 100%' }}
            />

            {/* Animated Glow Orbs */}
            <div className="absolute top-[-10%] right-[-5%] w-[40vw] h-[40vw] rounded-full bg-zinc-500/3 blur-[120px] animate-blob" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[35vw] h-[35vw] rounded-full bg-zinc-500/5 blur-[100px] animate-blob animation-delay-4000" />
          </div>
        );

      case 'glass':
        return (
          <div className="fixed inset-0 z-[-1] bg-background transition-colors duration-700 pointer-events-none">
            {/* Dark/Slate Orbs */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-zinc-900/20 blur-[120px]" />
              <div className="absolute top-[40%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[120px]" />
              <div className="absolute top-[80%] left-[10%] w-[60vw] h-[60vw] rounded-full bg-zinc-900/20 blur-[100px]" />
            </div>
          </div>
        );

      case 'mesh':
        return (
          <div className="fixed inset-0 z-[-1] bg-background transition-colors duration-700 pointer-events-none">
            {/* Dynamic Mesh Gradients */}
            <div className="absolute top-0 left-0 w-full h-[300vh] overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-zinc-900/40 to-transparent opacity-60" />

              {/* 1. Neutral (Top Left) */}
              <div className="absolute top-[-100px] left-[10%] w-[600px] h-[600px] bg-zinc-600/10 blur-[100px] rounded-full mix-blend-screen animate-blob" />

              {/* 2. Emerald (Top Right) */}
              <div className="absolute top-[5vh] right-[10%] w-[500px] h-[500px] bg-emerald-500/10 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-2000" />

              {/* 3. Primary/Orange (Upper Middle Right) */}
              <div className="absolute top-[40vh] right-[20%] w-[600px] h-[600px] bg-primary/10 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-4000" />

              {/* 4. Orange (Middle Left) */}
              <div className="absolute top-[55vh] left-[15%] w-[500px] h-[500px] bg-orange-500/15 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-2000" />

              {/* 5. Pink (Lower Middle) */}
              <div className="absolute top-[90vh] left-[40%] w-[700px] h-[700px] bg-pink-600/15 blur-[120px] rounded-full mix-blend-screen animate-blob" />

              {/* 6. Cyan (Bottom Right) */}
              <div className="absolute top-[130vh] right-[15%] w-[600px] h-[600px] bg-cyan-500/15 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-4000" />

              {/* 7. Yellow (Deep Bottom Left) */}
              <div className="absolute top-[180vh] left-[10%] w-[600px] h-[600px] bg-yellow-500/10 blur-[100px] rounded-full mix-blend-screen animate-blob" />
            </div>
          </div>
        );

      case 'neo':
        return (
          <div className="fixed inset-0 z-[-1] bg-[#0A0A0A] transition-colors duration-700 pointer-events-none">
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent h-[200vh]" />
          </div>
        );

      case 'standard':
      default:
        return (
          <div className="fixed inset-0 z-[-1] bg-background transition-colors duration-700 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[200vh] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-black/0 via-zinc-900/30 to-zinc-800/20" />

              {/* Distributed Flares - Pure Neutral */}
              <div className="absolute top-[5vh] right-[-10%] w-[800px] h-[800px] bg-zinc-800/10 blur-[130px] rounded-full" />
              <div className="absolute top-[50vh] left-[-20%] w-[800px] h-[800px] bg-zinc-900/10 blur-[100px] rounded-full" />
              <div className="absolute top-[100vh] right-[10%] w-[600px] h-[600px] bg-zinc-800/5 blur-[110px] rounded-full" />
            </div>
          </div>
        );
    }
  };

  return renderBackground();
}
