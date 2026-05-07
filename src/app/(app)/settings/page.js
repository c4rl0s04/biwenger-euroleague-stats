'use client';

import { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  Loader2,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  UserCircle2,
  ShieldCheck,
  Link2,
  Mail,
  Database,
} from 'lucide-react';
import { useSession } from 'next-auth/react';
import { PageHeader, ElegantCard, FadeIn } from '@/components/ui';
import Section from '@/components/layout/Section';

/**
 * BiwengerSettings Component
 * Handles linking the user's Biwenger account using their credentials
 */
function BiwengerSettings() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (session?.user?.email) {
      setEmail(session.user.email);
    }
  }, [session?.user?.email]);

  const isLinked = !!session?.user?.biwengerToken;

  const handleLink = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/user/link-biwenger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al vincular la cuenta');
      }

      setSuccess(true);
      setPassword('');

      // Update session to reflect the new token and email immediately
      if (update) {
        await update({
          biwengerToken: data.token,
          email: data.email,
        });
      }
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <Section
        title="Cuenta de Biwenger"
        subtitle="Vincular tu cuenta oficial permite sincronizar tus plantillas, puntos y mercado en tiempo real."
        className="!px-0 !py-0"
      >
        <ElegantCard padding="p-8 md:p-10" hideHeader className="overflow-visible">
          <div className="space-y-8">
            {/* Connection Status */}
            <div
              className={`p-6 rounded-2xl border flex items-center justify-between transition-all duration-500 ${
                isLinked
                  ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                  : 'bg-zinc-950/50 border-white/5 text-zinc-400'
              }`}
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    isLinked ? 'bg-emerald-500/20' : 'bg-zinc-900'
                  }`}
                >
                  <Database size={24} className={isLinked ? 'text-emerald-400' : 'text-zinc-600'} />
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] opacity-60">
                    Estado de Conexión
                  </p>
                  <p className="text-lg font-bold">
                    {isLinked ? 'Cuenta Vinculada Correctamente' : 'Sin Vincular'}
                  </p>
                </div>
              </div>
              {isLinked && (
                <div className="hidden sm:flex items-center gap-2 bg-emerald-500/20 px-4 py-1.5 rounded-full border border-emerald-500/30">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Activo</span>
                </div>
              )}
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            {!isLinked ? (
              <form onSubmit={handleLink} className="space-y-8">
                {/* Email */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Mail size={14} className="text-primary" />
                    Email de Biwenger
                  </label>
                  <div className="relative group">
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="ejemplo@biwenger.com"
                      className="w-full h-14 bg-zinc-950/50 border border-white/10 rounded-2xl pl-5 pr-5 text-base text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    {session?.user?.email && (
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-[10px] font-bold text-zinc-600 uppercase tracking-tighter pointer-events-none">
                        <ShieldCheck size={14} />
                        Email Guardado
                      </div>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-3">
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-[0.2em] ml-1 flex items-center gap-2">
                    <Lock size={14} className="text-primary" />
                    Contraseña de Biwenger
                  </label>
                  <div className="relative group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Introduce tu contraseña oficial de Biwenger"
                      className="w-full h-14 bg-zinc-950/50 border border-white/10 rounded-2xl pl-5 pr-14 text-base text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-primary transition-colors p-2"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-zinc-600 ml-1 italic">
                    * Tu contraseña solo se usa para obtener el token de acceso y nunca se guarda en
                    nuestro servidor.
                  </p>
                </div>

                {/* Feedback Messages */}
                <div className="min-h-[24px]">
                  {error && (
                    <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl animate-shake">
                      <AlertCircle size={20} className="shrink-0" />
                      <span className="font-medium">{error}</span>
                    </div>
                  )}

                  {success && (
                    <div className="flex items-center gap-3 p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl animate-fade-in">
                      <CheckCircle2 size={20} className="shrink-0" />
                      <span className="font-medium">
                        ¡Cuenta vinculada con éxito! Sincronización activada.
                      </span>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading || !password}
                    className="group relative w-full h-16 overflow-hidden rounded-2xl font-display text-xl uppercase tracking-[0.2em] text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-primary via-orange-500 to-primary transition-all group-hover:scale-105 duration-500" />
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                    <div className="relative flex items-center justify-center gap-4">
                      {loading ? (
                        <Loader2 className="animate-spin" size={24} />
                      ) : (
                        <>
                          <span>Vincular Cuenta</span>
                          <ChevronRight
                            size={22}
                            className="group-hover:translate-x-1.5 transition-transform duration-300"
                          />
                        </>
                      )}
                    </div>
                  </button>
                </div>
              </form>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center space-y-4 animate-in fade-in zoom-in-95 duration-700">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mb-2">
                  <ShieldCheck size={40} className="text-emerald-400" />
                </div>
                <h4 className="text-xl font-bold text-white tracking-tight">Acceso Sincronizado</h4>
                <p className="text-zinc-500 text-sm max-w-sm leading-relaxed">
                  Tu cuenta de Biwenger está vinculada correctamente. Estamos utilizando tu token de
                  acceso para mantener tus estadísticas al día de forma automática.
                </p>
                <button
                  onClick={() => {
                    // Logic to unlink or change could go here, but for now we just show a button if they want to re-link
                    // Or maybe just a "Change Account" button
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 hover:text-primary transition-colors pt-4 border-t border-white/5 w-full mt-8"
                >
                  ¿Deseas usar otra cuenta? Contacta con soporte
                </button>
              </div>
            )}
          </div>
        </ElegantCard>
      </Section>
    </div>
  );
}

function SecuritySettings() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Form states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Visibility states
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setError('Las nuevas contraseñas no coinciden.');
      setLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Error al cambiar la contraseña');
      }

      setSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header using Section template */}
      <Section
        title="Seguridad de Cuenta"
        subtitle="Actualiza tus credenciales de acceso para mantener la máxima protección."
        className="!px-0 !py-0"
      >
        <ElegantCard padding="p-8 md:p-10" hideHeader className="overflow-visible">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Current Password */}
            <div className="space-y-3">
              <label className="block text-xs font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">
                Contraseña Actual
              </label>
              <div className="relative group">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  required
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Introduce tu contraseña actual"
                  className="w-full h-14 bg-zinc-950/50 border border-white/10 rounded-2xl pl-5 pr-14 text-base text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(!showCurrent)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-primary transition-colors p-2"
                >
                  {showCurrent ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-white/5 to-transparent" />

            {/* New Passwords Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">
                  Nueva Contraseña
                </label>
                <div className="relative group">
                  <input
                    type={showNew ? 'text' : 'password'}
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full h-14 bg-zinc-950/50 border border-white/10 rounded-2xl pl-5 pr-14 text-base text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-primary transition-colors p-2"
                  >
                    {showNew ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-black text-zinc-500 uppercase tracking-[0.2em] ml-1">
                  Confirmar Nueva
                </label>
                <div className="relative group">
                  <input
                    type={showConfirm ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repite la contraseña"
                    className="w-full h-14 bg-zinc-950/50 border border-white/10 rounded-2xl pl-5 pr-14 text-base text-white placeholder:text-zinc-700 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary/40 transition-all duration-300"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-primary transition-colors p-2"
                  >
                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Feedback Messages */}
            <div className="min-h-[24px]">
              {error && (
                <div className="flex items-center gap-3 p-5 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-2xl animate-shake">
                  <AlertCircle size={20} className="shrink-0" />
                  <span className="font-medium">{error}</span>
                </div>
              )}

              {success && (
                <div className="flex items-center gap-3 p-5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm rounded-2xl animate-fade-in">
                  <CheckCircle2 size={20} className="shrink-0" />
                  <span className="font-medium">
                    ¡Contraseña actualizada con éxito! Se aplicará en tu próximo inicio de sesión.
                  </span>
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading || !currentPassword || !newPassword || !confirmPassword}
                className="group relative w-full h-16 overflow-hidden rounded-2xl font-display text-xl uppercase tracking-[0.2em] text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-primary via-orange-500 to-primary transition-all group-hover:scale-105 duration-500" />
                <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative flex items-center justify-center gap-4">
                  {loading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <>
                      <span>Actualizar Contraseña</span>
                      <ChevronRight
                        size={22}
                        className="group-hover:translate-x-1.5 transition-transform duration-300"
                      />
                    </>
                  )}
                </div>
              </button>
            </div>
          </form>
        </ElegantCard>
      </Section>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('security');

  const tabs = [
    { id: 'security', name: 'Seguridad', icon: KeyRound, component: <SecuritySettings /> },
    { id: 'biwenger', name: 'Biwenger', icon: Link2, component: <BiwengerSettings /> },
    { id: 'profile', name: 'Perfil Público', icon: UserCircle2, disabled: true },
  ];

  return (
    <div className="w-full">
      <FadeIn>
        {/* Page Header Component */}
        <PageHeader
          title="Ajustes de Cuenta"
          description="Personaliza tu experiencia y gestiona la seguridad de tu perfil de manager."
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
            {/* Sidebar Navigation */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-3">
                <div className="mb-6 px-2">
                  <h3 className="text-xl font-display uppercase tracking-widest text-zinc-400 flex items-center gap-2">
                    <div className="w-1 h-4 bg-primary rounded-full" />
                    Categorías
                  </h3>
                </div>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    disabled={tab.disabled}
                    onClick={() => setActiveTab(tab.id)}
                    className={`
                      w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 font-bold text-sm uppercase tracking-widest text-left group relative
                      ${
                        activeTab === tab.id
                          ? 'bg-primary/10 text-primary border border-primary/20 shadow-lg shadow-primary/5'
                          : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/5 border border-transparent'
                      }
                      ${tab.disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                  >
                    <tab.icon
                      size={20}
                      className={`${activeTab === tab.id ? 'text-primary' : 'text-zinc-500 group-hover:text-zinc-300'} transition-colors`}
                    />
                    <span>{tab.name}</span>

                    {activeTab === tab.id && (
                      <div className="absolute left-0 w-1 h-6 bg-primary rounded-full -translate-x-1" />
                    )}

                    {tab.disabled && (
                      <span className="ml-auto text-[8px] bg-zinc-800 text-zinc-500 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                        PRÓXIMAMENTE
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <div className="animate-in fade-in slide-in-from-right-4 duration-700">
                {tabs.find((t) => t.id === activeTab)?.component}
              </div>
            </div>
          </div>
        </div>
      </FadeIn>
    </div>
  );
}
