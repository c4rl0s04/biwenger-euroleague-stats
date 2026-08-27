'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useSession } from 'next-auth/react';
import { CheckCircle2, Download, Loader2, ShieldCheck, Smartphone } from 'lucide-react';

import { usePwa } from '@/components/pwa/PwaProvider';
import { useTheme } from '@/contexts/ThemeContext';

import MobileDetailScaffold from '../MobileDetailScaffold';

type SettingsSection = 'account' | 'biwenger' | 'appearance' | 'install';

function Feedback({ error, success }: { error: string; success: string }) {
  if (!error && !success) return null;
  return (
    <p className={`mobile-settings-feedback ${error ? 'is-error' : 'is-success'}`} role={error ? 'alert' : 'status'}>
      {error || success}
    </p>
  );
}

function AccountSettings() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword.length < 6) return setError('La nueva contraseña debe tener al menos 6 caracteres.');
    if (newPassword !== confirmPassword) return setError('Las contraseñas nuevas no coinciden.');
    setLoading(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No se ha podido cambiar la contraseña.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccess('Contraseña actualizada correctamente.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se ha podido cambiar la contraseña.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mobile-settings-form">
      <div className="mobile-settings-status">
        <ShieldCheck size={21} aria-hidden="true" />
        <span><strong>Acceso protegido</strong><small>La sesión permanece cifrada y privada.</small></span>
      </div>
      <label htmlFor="current-password">Contraseña actual</label>
      <input id="current-password" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
      <label htmlFor="new-password">Nueva contraseña</label>
      <input id="new-password" type="password" autoComplete="new-password" minLength={6} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
      <label htmlFor="confirm-password">Repite la nueva contraseña</label>
      <input id="confirm-password" type="password" autoComplete="new-password" minLength={6} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} required />
      <Feedback error={error} success={success} />
      <button type="submit" className="mobile-settings-submit" disabled={loading || !currentPassword || !newPassword || !confirmPassword}>
        {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
        Actualizar contraseña
      </button>
    </form>
  );
}

function BiwengerSettings() {
  const { data: session, update } = useSession();
  const [email, setEmail] = useState(session?.user?.email ?? '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const isLinked = Boolean(
    (session?.user as { biwengerToken?: string } | undefined)?.biwengerToken
  );

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await fetch('/api/user/link-biwenger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'No se ha podido vincular la cuenta.');
      await update?.({ biwengerToken: data.token, email: data.email });
      setPassword('');
      setSuccess('Cuenta vinculada y lista para sincronizar.');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'No se ha podido vincular la cuenta.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit} className="mobile-settings-form">
      <div className={`mobile-settings-status ${isLinked ? 'is-linked' : ''}`}>
        <ShieldCheck size={21} aria-hidden="true" />
        <span><strong>{isLinked ? 'Cuenta vinculada' : 'Vinculación pendiente'}</strong><small>La contraseña de Biwenger no se almacena.</small></span>
      </div>
      <label htmlFor="biwenger-email">Email de Biwenger</label>
      <input id="biwenger-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required />
      <label htmlFor="biwenger-password">Contraseña de Biwenger</label>
      <input id="biwenger-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} required />
      <Feedback error={error} success={success} />
      <button type="submit" className="mobile-settings-submit" disabled={loading || !email || !password}>
        {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
        {isLinked ? 'Renovar conexión' : 'Vincular cuenta'}
      </button>
    </form>
  );
}

function AppearanceSettings() {
  const { showSnow, toggleSnow } = useTheme();
  return (
    <div className="mobile-settings-options">
      <div className="mobile-settings-option">
        <span><strong>Tema oscuro</strong><small>Identidad visual principal de BiwengerStats</small></span>
        <span className="mobile-settings-badge">Activo</span>
      </div>
      <div className="mobile-settings-option">
        <span><strong>Efecto de nieve</strong><small>Preferencia visual guardada en este dispositivo</small></span>
        <button type="button" role="switch" aria-checked={showSnow} onClick={toggleSnow} className="mobile-settings-switch"><span /></button>
      </div>
    </div>
  );
}

function InstallSettings() {
  const { isStandalone, canInstall, install, platform } = usePwa();
  return (
    <div className="mobile-settings-install">
      <div className="mobile-settings-install-hero">
        <Smartphone size={30} aria-hidden="true" />
        <strong>{isStandalone ? 'Ya estás usando la aplicación' : 'Instala BiwengerStats'}</strong>
        <p>{isStandalone ? 'Se ejecuta a pantalla completa y conserva tu sesión.' : `Experiencia optimizada para ${platform === 'ios' ? 'iPhone' : platform === 'android' ? 'Android' : 'tu dispositivo'}.`}</p>
      </div>
      {!isStandalone && canInstall && <button type="button" onClick={install} className="mobile-settings-submit"><Download aria-hidden="true" /> Instalar ahora</button>}
      {!isStandalone && !canInstall && <Link href="/install" className="mobile-settings-submit"><Download aria-hidden="true" /> Ver instrucciones</Link>}
    </div>
  );
}

const copy: Record<SettingsSection, { title: string; description: string }> = {
  account: { title: 'Cuenta y seguridad', description: 'Actualiza tus credenciales de acceso.' },
  biwenger: { title: 'Conexión Biwenger', description: 'Gestiona la fuente privada de tus datos.' },
  appearance: { title: 'Apariencia', description: 'Preferencias visuales de este dispositivo.' },
  install: { title: 'Instalación', description: 'Estado e instrucciones de la aplicación.' },
};

export default function MobileSettingsDetail({ section }: { section: SettingsSection }) {
  const current = copy[section];
  return (
    <MobileDetailScaffold title={current.title} context="Ajustes" backHref="/settings" description={current.description}>
      {section === 'account' && <AccountSettings />}
      {section === 'biwenger' && <BiwengerSettings />}
      {section === 'appearance' && <AppearanceSettings />}
      {section === 'install' && <InstallSettings />}
    </MobileDetailScaffold>
  );
}
