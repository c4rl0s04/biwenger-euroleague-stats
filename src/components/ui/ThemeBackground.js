'use client';

import { useSyncExternalStore } from 'react';
import { useCardTheme } from '@/contexts/CardThemeContext';

// Subscription function for useSyncExternalStore (no-op - value never changes)
const emptySubscribe = () => () => {};

// These functions determine if we're mounted (client-side)
const getSnapshot = () => true;
const getServerSnapshot = () => false;

export default function ThemeBackground() {
  const { theme } = useCardTheme();

  // useSyncExternalStore returns false on server, true on client after hydration
  const isClient = useSyncExternalStore(emptySubscribe, getSnapshot, getServerSnapshot);

  // Render placeholder on server to prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="fixed inset-0 z-[-1] bg-slate-950 transition-colors duration-700 pointer-events-none" />
    );
  }

  const renderBackground = () => {
    switch (theme) {
      case 'glass':
        return (
          <div className="fixed inset-0 z-[-1] bg-slate-950 transition-colors duration-700 pointer-events-none">
            {/* Deep Blue/Violet Orbs - SCROLLABLE COMPONENT */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-indigo-900/20 blur-[120px]" />
              <div className="absolute top-[40%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-900/10 blur-[120px]" />
              <div className="absolute top-[80%] left-[10%] w-[60vw] h-[60vw] rounded-full bg-violet-900/20 blur-[100px]" />
              {/* Noise texture fixed */}
              <div className="fixed inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
            </div>
          </div>
        );

      case 'mesh':
        return (
          <div className="fixed inset-0 z-[-1] bg-slate-950 transition-colors duration-700 pointer-events-none">
            {/* Dynamic Mesh Gradients - SCROLLABLE MOCKUP */}
            {/* We use a very tall container to simulate scrollable background even if fixed, 
                 or better: we position elements based on viewport height but distributed 
                 so they are revealed. Actually, user wants movement when scrolling. 
                 To do that naturally, we need 'absolute' in a relative body. 
                 BUT 'ThemeBackground' is at root. 
                 
                 Let's try 'absolute' with h-full w-full and ensuring parent has height.
                 If client wrapper doesn't have height, we might need a different approach.
                 However, fixed with Parallax is hard without JS.
                 
                 SIMPLEST FIX: 'absolute' inset-0 z-[-1] and assume body grows.
             */}
            <div className="absolute top-0 left-0 w-full h-[300vh] overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-950/40 to-transparent opacity-60" />

              {/* 1. Purple (Top Left) */}
              <div className="absolute top-[-100px] left-[10%] w-[600px] h-[600px] bg-purple-600/20 blur-[100px] rounded-full mix-blend-screen animate-blob" />

              {/* 2. Emerald (Top Right - NEW) */}
              <div className="absolute top-[5vh] right-[10%] w-[500px] h-[500px] bg-emerald-500/15 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-2000" />

              {/* 3. Blue (Upper Middle Right) */}
              <div className="absolute top-[40vh] right-[20%] w-[600px] h-[600px] bg-blue-600/20 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-4000" />

              {/* 4. Orange (Middle Left - NEW) */}
              <div className="absolute top-[55vh] left-[15%] w-[500px] h-[500px] bg-orange-500/15 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-2000" />

              {/* 5. Pink (Lower Middle) */}
              <div className="absolute top-[90vh] left-[40%] w-[700px] h-[700px] bg-pink-600/15 blur-[120px] rounded-full mix-blend-screen animate-blob" />

              {/* 6. Cyan (Bottom Right - NEW) */}
              <div className="absolute top-[130vh] right-[15%] w-[600px] h-[600px] bg-cyan-500/15 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-4000" />

              {/* 7. Yellow (Deep Bottom Left - NEW) */}
              <div className="absolute top-[180vh] left-[10%] w-[600px] h-[600px] bg-yellow-500/10 blur-[100px] rounded-full mix-blend-screen animate-blob" />
            </div>
          </div>
        );

      case 'neo':
        return (
          <div className="fixed inset-0 z-[-1] bg-[#0A0A0A] transition-colors duration-700 pointer-events-none">
            {/* Technical Grid Pattern - Fixed is good for grid, but maybe user wants it to scroll? 
                 Usually grids look better fixed or scrolling naturally. Let's let it scroll. */}
            <div
              className="absolute inset-0 h-[200vh]"
              style={{
                backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`,
                backgroundSize: '40px 40px',
                opacity: 0.5,
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent h-[200vh]" />
          </div>
        );

      case 'standard':
      default:
        return (
          <div className="fixed inset-0 z-[-1] bg-slate-950 transition-colors duration-700 pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[200vh] overflow-hidden">
              {/* Noise Texture (Fixed usually better but let's scroll it for consistency) */}
              <div
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`,
                }}
              />

              <div className="absolute inset-0 bg-gradient-to-br from-slate-950/0 via-slate-900/30 to-slate-800/30" />

              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
                  backgroundSize: '50px 50px',
                }}
              />

              {/* Distributed Flares */}
              <div className="absolute top-[10vh] right-[-10%] w-[800px] h-[800px] bg-orange-500/10 blur-[120px] rounded-full" />
              <div className="absolute top-[60vh] left-[-20%] w-[800px] h-[800px] bg-amber-500/10 blur-[100px] rounded-full" />
              <div className="absolute top-[120vh] right-[10%] w-[600px] h-[600px] bg-indigo-500/5 blur-[100px] rounded-full" />
            </div>
          </div>
        );
    }
  };

  return renderBackground();
}
