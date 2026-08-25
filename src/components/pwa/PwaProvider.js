'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { Download, RefreshCw, Share2, X } from 'lucide-react';
import {
  detectPwaPlatform,
  isStandaloneDisplay,
  shouldShowInstallPromotion,
} from '@/lib/pwa/platform';

const VISITS_KEY = 'biwengerstats:pwa-visits';
const DISMISSED_KEY = 'biwengerstats:pwa-dismissed-at';
const SESSION_VISIT_KEY = 'biwengerstats:pwa-session-counted';
const PUBLIC_ROUTES = new Set(['/login', '/install', '/offline']);

const PwaContext = createContext({
  platform: 'desktop',
  isStandalone: false,
  canInstall: false,
  install: async () => false,
});

export function usePwa() {
  return useContext(PwaContext);
}

function getStandaloneState() {
  const displayModeStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const navigatorStandalone = window.navigator.standalone === true;
  return isStandaloneDisplay({ displayModeStandalone, navigatorStandalone });
}

const subscribeToHydration = () => () => {};
const getClientHydrationSnapshot = () => true;
const getServerHydrationSnapshot = () => false;

export default function PwaProvider({ children }) {
  const pathname = usePathname();
  const installPromptRef = useRef(null);
  const waitingWorkerRef = useRef(null);
  const reloadOnControllerChangeRef = useRef(false);
  const isHydrated = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot
  );
  const platform = isHydrated ? detectPwaPlatform(window.navigator.userAgent) : 'desktop';
  const [installedStandalone, setInstalledStandalone] = useState(false);
  const isStandalone = installedStandalone || (isHydrated && getStandaloneState());
  const [canInstall, setCanInstall] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    const standalone = getStandaloneState();
    let active = true;

    if (!PUBLIC_ROUTES.has(pathname)) {
      const previousVisits = Number.parseInt(window.localStorage.getItem(VISITS_KEY) || '0', 10);
      const sessionAlreadyCounted = window.sessionStorage.getItem(SESSION_VISIT_KEY) === '1';
      const visits = sessionAlreadyCounted ? previousVisits : previousVisits + 1;
      const dismissedValue = window.localStorage.getItem(DISMISSED_KEY);
      const dismissedAt = dismissedValue ? Number.parseInt(dismissedValue, 10) : null;
      if (!sessionAlreadyCounted) {
        window.localStorage.setItem(VISITS_KEY, String(visits));
        window.sessionStorage.setItem(SESSION_VISIT_KEY, '1');
      }
      const promotionVisible = shouldShowInstallPromotion({
        visits,
        isStandalone: standalone,
        dismissedAt,
      });
      queueMicrotask(() => {
        if (active) setShowPromotion(promotionVisible);
      });
    }
    return () => {
      active = false;
    };
  }, [pathname]);

  useEffect(() => {
    const handleBeforeInstall = (event) => {
      event.preventDefault();
      installPromptRef.current = event;
      setCanInstall(true);
    };
    const handleInstalled = () => {
      installPromptRef.current = null;
      setCanInstall(false);
      setShowPromotion(false);
      setInstalledStandalone(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return undefined;
    if (!window.isSecureContext && window.location.hostname !== 'localhost') return undefined;

    let active = true;
    let onControllerChange;

    navigator.serviceWorker
      .register('/sw.js', { scope: '/' })
      .then((registration) => {
        if (!active) return;
        if (registration.waiting && navigator.serviceWorker.controller) {
          waitingWorkerRef.current = registration.waiting;
          setUpdateAvailable(true);
        }

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing;
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'installed' && navigator.serviceWorker.controller) {
              waitingWorkerRef.current = registration.waiting || worker;
              setUpdateAvailable(true);
            }
          });
        });

        onControllerChange = () => {
          if (reloadOnControllerChangeRef.current) window.location.reload();
        };
        navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);
      })
      .catch(() => {
        // Installation is optional; the web application remains fully functional without it.
      });

    return () => {
      active = false;
      if (onControllerChange) {
        navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
      }
    };
  }, []);

  const install = useCallback(async () => {
    const prompt = installPromptRef.current;
    if (!prompt) return false;
    await prompt.prompt();
    const choice = await prompt.userChoice;
    if (choice?.outcome === 'accepted') {
      installPromptRef.current = null;
      setCanInstall(false);
      setShowPromotion(false);
      return true;
    }
    return false;
  }, []);

  const dismissPromotion = () => {
    window.localStorage.setItem(DISMISSED_KEY, String(Date.now()));
    setShowPromotion(false);
  };

  const activateUpdate = () => {
    reloadOnControllerChangeRef.current = true;
    waitingWorkerRef.current?.postMessage({ type: 'SKIP_WAITING' });
  };

  const value = useMemo(
    () => ({ platform, isStandalone, canInstall, install }),
    [platform, isStandalone, canInstall, install]
  );

  return (
    <PwaContext.Provider value={value}>
      {children}
      {showPromotion && !isStandalone && !PUBLIC_ROUTES.has(pathname) && (
        <aside aria-label="Instalar Biwenger Stats" className="pwa-install-promotion">
          <button
            type="button"
            onClick={dismissPromotion}
            className="pwa-install-close"
            aria-label="Ocultar aviso de instalación durante 30 días"
          >
            <X size={18} aria-hidden="true" />
          </button>
          <div className="pwa-install-icon" aria-hidden="true">
            {platform === 'ios' ? <Share2 size={21} /> : <Download size={21} />}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black text-white">Lleva BiwengerStats contigo</p>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              {platform === 'ios'
                ? 'Añádela a tu pantalla de inicio para abrirla como una app.'
                : 'Instálala para acceder desde tu pantalla de inicio.'}
            </p>
          </div>
          {canInstall ? (
            <button type="button" onClick={install} className="pwa-install-action">
              Instalar
            </button>
          ) : (
            <Link href="/install" className="pwa-install-action">
              Ver pasos
            </Link>
          )}
        </aside>
      )}
      {updateAvailable && (
        <aside className="pwa-update-toast" role="status" aria-live="polite">
          <RefreshCw size={18} className="text-primary" aria-hidden="true" />
          <span className="text-sm font-bold text-white">Hay una versión nueva disponible.</span>
          <button type="button" onClick={activateUpdate} className="pwa-update-action">
            Actualizar
          </button>
        </aside>
      )}
    </PwaContext.Provider>
  );
}
