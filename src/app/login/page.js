'use client';

import { useState, useRef } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Lock, AlertCircle, Loader2, Eye, EyeOff, Trophy, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// --- Utility for cleaner tailwind classes ---
function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// --- Component: Spotlight Card (Glow follows mouse) ---
function SpotlightCard({ children, className = '' }) {
  const divRef = useRef(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={cn(
        'relative overflow-hidden rounded-xl border border-neutral-800 bg-neutral-900/50 text-neutral-200 shadow-2xl',
        className
      )}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(255,100,0,0.15), transparent 40%)`,
        }}
      />
      <div className="relative h-full">{children}</div>
    </div>
  );
}

// --- Component: Background Mesh Animation ---
function Background() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-neutral-950">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-orange-600/20 blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] animate-pulse delay-700" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
    </div>
  );
}

// --- Main Page Component ---
export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const result = await signIn('credentials', {
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Código incorrecto');
        setLoading(false);
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Error de conexión');
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 font-sans text-neutral-100 selection:bg-orange-500/30">
      <Background />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-md z-10"
      >
        {/* Header Section */}
        <div className="text-center mb-10 flex flex-col items-center">
          {/* UPDATED ICON: Standalone, larger, with a glow effect */}
          <div className="mb-4 relative">
            <div className="absolute inset-0 bg-orange-500 blur-[20px] opacity-20 rounded-full"></div>
            <Trophy className="relative w-12 h-12 text-orange-500 drop-shadow-[0_2px_10px_rgba(249,115,22,0.3)]" />
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 mb-2">
            Biwenger Stats
          </h1>
          <p className="text-neutral-400 text-sm flex items-center justify-center gap-2 mt-2">
            <Activity className="w-3 h-3 text-green-500" />
            Panel de Control Privado
          </p>
        </div>

        {/* Card Section */}
        <SpotlightCard className="backdrop-blur-xl bg-neutral-900/60 border-white/10">
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label
                  htmlFor="password"
                  className="text-xs font-semibold text-neutral-400 uppercase tracking-wider ml-1"
                >
                  Código de Acceso
                </label>
                <div className="relative group">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-500 group-focus-within:text-orange-500 transition-colors duration-300" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-neutral-950/50 border border-white/10 rounded-lg py-3 pl-10 pr-10 text-neutral-200 placeholder:text-neutral-700 focus:outline-none focus:ring-1 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all duration-300"
                    placeholder="••••••••"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Error Message with Shake Animation */}
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 text-red-200 text-sm">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      {error}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* UPDATED BUTTON: Added cursor-pointer */}
              <button
                type="submit"
                disabled={loading}
                className="relative w-full overflow-hidden rounded-lg group text-white font-bold py-4 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer shadow-xl shadow-orange-500/20"
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[hsl(19,99%,49%)] to-[hsl(30,100%,50%)] transition-all duration-300 group-hover:brightness-110" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Verificando...</span>
                    </>
                  ) : (
                    'Entrar al Panel'
                  )}
                </span>
              </button>
            </form>
          </div>
        </SpotlightCard>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs text-neutral-600 mt-8 font-medium"
        >
          &copy; {new Date().getFullYear()} Biwenger Stats v2.0
        </motion.p>
      </motion.div>
    </div>
  );
}
