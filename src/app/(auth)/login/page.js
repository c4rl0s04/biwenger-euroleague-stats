'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Eye, EyeOff, User, Lock, ChevronRight } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  let callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  if (callbackUrl.includes('localhost')) {
    try {
      const url = new URL(callbackUrl);
      callbackUrl = url.pathname + url.search;
    } catch {
      callbackUrl = '/dashboard';
    }
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await signIn('credentials', { name, password, redirect: false });
      if (res?.error) {
        setError('Credenciales incorrectas. Revisa tu nombre de Manager o contraseña.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-dvh flex flex-col md:flex-row bg-background overflow-hidden">
      {/* ─────────────────────────────────────────
          LEFT PANEL — Brand / Visual
      ───────────────────────────────────────── */}
      <div className="relative hidden md:flex md:w-1/2 lg:w-[58%] flex-col items-center justify-center overflow-hidden">
        {/* Dark base */}
        <div className="absolute inset-0 bg-background" />

        {/* Subtle dot grid */}
        <div
          className="absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage: 'radial-gradient(hsl(var(--border)) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Animated radial orbs */}
        <div
          className="absolute top-[-15%] left-[-10%] w-[70%] h-[70%] rounded-full animate-blob"
          style={{
            background: 'radial-gradient(circle, hsla(19,99%,49%,0.12) 0%, transparent 70%)',
          }}
        />
        <div
          className="absolute bottom-[-20%] right-[-10%] w-[65%] h-[65%] rounded-full animate-blob animation-delay-2000"
          style={{
            background: 'radial-gradient(circle, hsla(19,99%,49%,0.08) 0%, transparent 70%)',
          }}
        />

        {/* Top-left corner bracket */}
        <div className="absolute top-8 left-8 w-10 h-10 border-t-2 border-l-2 border-primary/30 rounded-tl-sm" />
        {/* Bottom-right corner bracket */}
        <div className="absolute bottom-8 right-8 w-10 h-10 border-b-2 border-r-2 border-primary/30 rounded-br-sm" />

        {/* Vertical right-side separator */}
        <div
          className="absolute right-0 top-0 bottom-0 w-px"
          style={{
            background:
              'linear-gradient(180deg, transparent 0%, hsl(var(--border)) 30%, hsl(var(--border)) 70%, transparent 100%)',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-12 max-w-2xl">
          {/* Logo with concentric radar rings */}
          <div className="relative mb-4 group">
            {/* Pulsing ring 1 */}
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-10 scale-110"
              style={{
                background: 'transparent',
                border: '2px solid hsla(19,99%,49%,1)',
                animationDuration: '2.5s',
              }}
            />
            {/* Pulsing ring 2 — offset */}
            <div
              className="absolute inset-0 rounded-full animate-ping opacity-[0.06] scale-125"
              style={{
                background: 'transparent',
                border: '2px solid hsla(19,99%,49%,1)',
                animationDuration: '2.5s',
                animationDelay: '0.8s',
              }}
            />
            {/* Static glow bloom */}
            <div
              className="absolute inset-0 rounded-full blur-3xl scale-[2] opacity-35 group-hover:opacity-55 transition-opacity duration-700"
              style={{
                background: 'radial-gradient(circle, hsla(19,99%,49%,0.8), transparent 65%)',
              }}
            />
            {/* Logo */}
            <div className="relative w-72 h-72 transition-transform group-hover:scale-[1.03] duration-500 animate-float">
              <Image
                src="/brand-logo.png"
                alt="Biwenger Stats Logo"
                fill
                priority
                unoptimized
                className="object-contain drop-shadow-[0_0_56px_hsla(19,99%,49%,0.7)]"
                sizes="288px"
              />
            </div>
          </div>

          {/* Brand block */}
          <div className="mb-5">
            <h1 className="font-display text-8xl lg:text-9xl text-foreground tracking-widest leading-none">
              Biwenger
            </h1>
            <h2
              className="font-display text-7xl lg:text-8xl tracking-widest leading-none"
              style={{
                background: 'linear-gradient(135deg, #fa5001, #ff8c00)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Stats
            </h2>
          </div>

          {/* Orange accent divider */}
          <div className="flex items-center gap-3 mb-5 w-full justify-center">
            <div
              className="h-px flex-1 max-w-[80px]"
              style={{ background: 'linear-gradient(90deg, transparent, #fa5001)' }}
            />
            <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse-glow" />
            <div
              className="h-px flex-1 max-w-[80px]"
              style={{ background: 'linear-gradient(90deg, #fa5001, transparent)' }}
            />
          </div>

          {/* Tagline */}
          <p className="text-muted-foreground text-sm leading-relaxed max-w-[280px]">
            Análisis avanzado de la Euroleague para managers de élite.
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────
          RIGHT PANEL — Login Form
      ───────────────────────────────────────── */}
      <div className="flex flex-1 items-center justify-center px-6 py-16 md:py-0 relative">
        {/* Mobile-only background glow */}
        <div className="absolute inset-0 md:hidden pointer-events-none">
          <div
            className="absolute top-0 left-1/2 -translate-x-1/2 w-[80vw] h-[50vw] rounded-full blur-[80px]"
            style={{ background: 'radial-gradient(circle, hsla(19,99%,49%,0.08), transparent)' }}
          />
        </div>

        <div className="relative z-10 w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex flex-col items-center mb-10 md:hidden">
            <div className="relative w-24 h-24 mb-4">
              <Image
                src="/brand-logo.png"
                alt="Biwenger Stats"
                fill
                priority
                unoptimized
                className="object-contain drop-shadow-[0_0_20px_hsla(19,99%,49%,0.5)]"
                sizes="96px"
              />
            </div>
            <p className="font-display text-3xl text-foreground tracking-widest">
              Biwenger <span style={{ color: '#fa5001' }}>Stats</span>
            </p>
          </div>

          {/* Heading */}
          <div className="mb-8">
            <h2 className="font-display text-4xl text-foreground tracking-wider mb-1.5">Acceder</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Introduce tus credenciales de manager para continuar.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* Manager name */}
            <div>
              <label
                htmlFor="login-name"
                className="block text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2"
              >
                Manager
              </label>
              <div className="relative">
                <User
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-name"
                  type="text"
                  autoComplete="username"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: All Stars"
                  className="w-full h-12 bg-card border border-border rounded-xl pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="login-password"
                className="block text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-2"
              >
                Contraseña
              </label>
              <div className="relative">
                <Lock
                  size={15}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
                  aria-hidden="true"
                />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-12 bg-card border border-border rounded-xl pl-10 pr-12 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-all"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer p-1 rounded"
                >
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2.5 bg-destructive/10 border border-destructive/25 text-destructive text-xs py-3 px-4 rounded-xl leading-relaxed"
              >
                <span className="shrink-0 mt-0.5">⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !name || !password}
              className="relative w-full h-12 mt-1 flex items-center justify-center gap-2.5 rounded-xl font-bold text-sm uppercase tracking-[0.12em] overflow-hidden cursor-pointer transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed text-white"
              style={{
                background: 'linear-gradient(135deg, #fa5001 0%, #ff8c00 100%)',
                boxShadow: '0 4px 24px hsla(19, 99%, 49%, 0.35)',
              }}
            >
              {/* Hover shine */}
              <span className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  <span>Entrar</span>
                  <ChevronRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Footer note */}
          <p className="mt-10 text-center text-[10px] text-muted-foreground/40 uppercase tracking-[0.15em] leading-relaxed">
            Sistema de acceso restringido · Liga Euroleague
          </p>
        </div>
      </div>
    </main>
  );
}
