'use client';

import { useState } from 'react';
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
} from 'lucide-react';
import { PageHeader, ElegantCard, FadeIn } from '@/components/ui';
import Section from '@/components/layout/Section';

/**
 * SecuritySettings Component
 * Handles password changes and security-related configurations
 */
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
