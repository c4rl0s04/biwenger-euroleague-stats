'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Sparkles, Loader2, ShieldCheck, User } from 'lucide-react';
import { ThemeBackground } from '@/components/ui';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Sanitize callbackUrl to prevent absolute redirects to localhost
  let callbackUrl = searchParams.get('callbackUrl') || '/dashboard';
  if (callbackUrl.includes('localhost')) {
    try {
      const url = new URL(callbackUrl);
      callbackUrl = url.pathname + url.search;
    } catch (e) {
      // If it's not a valid URL, just use the fallback
      callbackUrl = '/dashboard';
    }
  }

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await signIn('credentials', {
        name,
        password,
        redirect: false,
      });

      if (res?.error) {
        setError('Credenciales incorrectas. Revisa tu nombre de Manager o contraseña.');
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch (err) {
      setError('Ocurrió un error inesperado. Inténtalo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <ThemeBackground variant="aurora" />

      <div className="relative z-10 w-full max-w-md px-6 animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-500/20 mb-4 rotate-3">
            <ShieldCheck className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">ELITE MANAGER</h1>
          <p className="text-zinc-400 text-sm font-medium">Panel de Control Avanzado</p>
        </div>

        <div className="bg-zinc-950/40 backdrop-blur-3xl border border-white/10 p-8 rounded-3xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
                Manager
              </label>
              <div className="relative">
                <User
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
                  size={18}
                />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: All Stars"
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2 ml-1">
                Contraseña
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-black/40 border border-white/10 rounded-xl py-3 px-4 text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs py-3 px-4 rounded-xl animate-shake">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full relative group bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 rounded-xl transition-all shadow-xl shadow-indigo-600/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center justify-center gap-2">
                {loading ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <>
                    <Sparkles size={18} />
                    <span className="uppercase tracking-widest text-sm">Entrar al Sistema</span>
                  </>
                )}
              </div>
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-[10px] text-zinc-600 uppercase tracking-widest leading-relaxed">
              Sistema de Acceso Restringido
              <br />
              Miembros de la Liga Euroleague
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
