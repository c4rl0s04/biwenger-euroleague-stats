'use client';

import { useCardTheme } from '@/contexts/CardThemeContext';
import { useEffect, useState } from 'react';

export default function ThemeBackground() {
  const { theme } = useCardTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const renderBackground = () => {
    switch (theme) {
      case 'glass':
        return (
          <div className="fixed inset-0 z-[-1] bg-slate-950 transition-colors duration-700">
             {/* Deep Blue/Violet Orbs for Glass Effect */}
             <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-900/20 blur-[120px]" />
             <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-900/20 blur-[120px]" />
             <div className="absolute top-[20%] right-[20%] w-[30%] h-[30%] rounded-full bg-violet-900/20 blur-[100px]" />
             {/* Noise texture */}
             <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
          </div>
        );
      
      case 'mesh':
        return (
          <div className="fixed inset-0 z-[-1] bg-slate-950 transition-colors duration-700">
             {/* Dynamic Mesh Gradients */}
             <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-950/40 to-transparent opacity-60" />
             <div className="absolute top-[-100px] left-[20%] w-[400px] h-[400px] bg-purple-600/20 blur-[100px] rounded-full mix-blend-screen animate-blob" />
             <div className="absolute top-[-100px] right-[20%] w-[400px] h-[400px] bg-blue-600/20 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-2000" />
             <div className="absolute top-[100px] left-[50%] translate-x-[-50%] w-[400px] h-[400px] bg-pink-600/20 blur-[100px] rounded-full mix-blend-screen animate-blob animation-delay-4000" />
          </div>
        );

      case 'neo':
        return (
          <div className="fixed inset-0 z-[-1] bg-[#0A0A0A] transition-colors duration-700">
             {/* Technical Grid Pattern */}
             <div className="absolute inset-0" 
                  style={{
                    backgroundImage: `linear-gradient(#1a1a1a 1px, transparent 1px), linear-gradient(90deg, #1a1a1a 1px, transparent 1px)`,
                    backgroundSize: '40px 40px',
                    opacity: 0.5
                  }}
             />
             {/* Center Spotlight */}
             <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0A] via-transparent to-transparent" />
          </div>
        );

      case 'standard':
      default:
        // The "Original" Orange/Space theme the user liked
        return (
          <div className="fixed inset-0 z-[-1] bg-slate-950 transition-colors duration-700">
             {/* Noise Texture */}
             <div className="absolute inset-0 opacity-[0.04]" 
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='1'/%3E%3C/svg%3E")`
                }}
             />
             
             {/* Dark Diagonal Overlay */}
             <div className="absolute inset-0 bg-gradient-to-br from-slate-950/0 via-slate-900/30 to-slate-800/30" />

             {/* Subtle Grid */}
             <div className="absolute inset-0"
                  style={{
                      backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.03) 1px, transparent 1px)`,
                      backgroundSize: '50px 50px'
                  }}
             />
             
             {/* Orange Flares */}
             <div className="absolute top-[20%] right-[0] w-[60%] h-[60%] bg-orange-500/10 blur-[120px] rounded-full translate-x-[30%]" />
             <div className="absolute bottom-[0] left-[0] w-[50%] h-[50%] bg-amber-500/10 blur-[100px] rounded-full translate-y-[30%] translate-x-[-20%]" />
             <div className="absolute top-[-10%] left-[50%] w-[40%] h-[40%] bg-indigo-500/5 blur-[100px] rounded-full translate-x-[-50%]" />
          </div>
        );
    }
  };

  return renderBackground();
}
