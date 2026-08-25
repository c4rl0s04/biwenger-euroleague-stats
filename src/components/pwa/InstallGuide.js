'use client';

import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Check,
  Download,
  ExternalLink,
  Monitor,
  Share2,
  Smartphone,
} from 'lucide-react';
import { usePwa } from './PwaProvider';

const guides = {
  ios: {
    eyebrow: 'iPhone y iPad',
    title: 'Instalar desde Safari',
    icon: Share2,
    steps: [
      'Abre esta página en Safari.',
      'Pulsa el botón Compartir de la barra del navegador.',
      'Selecciona “Añadir a pantalla de inicio”.',
      'Confirma pulsando “Añadir”.',
    ],
  },
  android: {
    eyebrow: 'Android',
    title: 'Instalar desde Chrome',
    icon: Smartphone,
    steps: [
      'Abre esta página en Chrome.',
      'Pulsa “Instalar” en esta pantalla o abre el menú de Chrome.',
      'Selecciona “Instalar aplicación” o “Añadir a pantalla de inicio”.',
      'Confirma la instalación.',
    ],
  },
  desktop: {
    eyebrow: 'Ordenador',
    title: 'Instalar desde el navegador',
    icon: Monitor,
    steps: [
      'Abre BiwengerStats en Chrome o Edge.',
      'Pulsa el icono de instalación de la barra de direcciones.',
      'Confirma para abrirla en una ventana independiente.',
    ],
  },
};

export default function InstallGuide() {
  const { platform, isStandalone, canInstall, install } = usePwa();
  const guide = guides[platform] || guides.desktop;
  const GuideIcon = guide.icon;

  return (
    <main className="install-page">
      <div className="install-page-glow" aria-hidden="true" />
      <div className="relative z-10 mx-auto w-full max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
        <Link href="/dashboard" className="install-back-link">
          <ArrowLeft size={18} aria-hidden="true" /> Volver a la aplicación
        </Link>

        <section className="mt-8 overflow-hidden rounded-[2rem] border border-white/10 bg-zinc-950/85 shadow-2xl shadow-black/40">
          <div className="install-hero">
            <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-[1.75rem] border border-white/10 bg-black shadow-2xl shadow-orange-950/50 sm:h-32 sm:w-32">
              <Image
                src="/icons/icon-192.png"
                alt=""
                fill
                unoptimized
                sizes="128px"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">
                Progressive Web App
              </p>
              <h1 className="mt-3 text-4xl leading-none text-white sm:text-6xl">
                BiwengerStats en tu móvil
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                Accede desde tu pantalla de inicio y utiliza la web a pantalla completa, sin
                instalar nada desde una tienda.
              </p>
            </div>
          </div>

          {isStandalone ? (
            <div className="m-5 flex items-start gap-4 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-5 sm:m-8">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-400/15 text-emerald-300">
                <Check size={22} aria-hidden="true" />
              </div>
              <div>
                <h2 className="text-xl text-emerald-100">Ya está instalada</h2>
                <p className="mt-1 text-sm leading-6 text-emerald-100/65">
                  Estás usando BiwengerStats en modo aplicación.
                </p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 p-5 sm:p-8 lg:grid-cols-[1.2fr_.8fr]">
              <section className="rounded-3xl border border-white/8 bg-white/[0.035] p-5 sm:p-7">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <GuideIcon size={24} aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
                      {guide.eyebrow}
                    </p>
                    <h2 className="mt-1 text-2xl text-white">{guide.title}</h2>
                  </div>
                </div>

                <ol className="mt-7 space-y-4">
                  {guide.steps.map((step, index) => (
                    <li key={step} className="flex gap-4 text-sm leading-6 text-zinc-300">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-primary/25 bg-primary/10 text-xs font-black text-primary">
                        {index + 1}
                      </span>
                      <span className="pt-1">{step}</span>
                    </li>
                  ))}
                </ol>

                {canInstall && (
                  <button type="button" onClick={install} className="install-primary-button">
                    <Download size={19} aria-hidden="true" /> Instalar ahora
                  </button>
                )}
              </section>

              <aside className="rounded-3xl border border-orange-400/15 bg-orange-400/[0.055] p-5 sm:p-7">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-300">
                  Qué cambia
                </p>
                <ul className="mt-5 space-y-4 text-sm leading-6 text-zinc-300">
                  {[
                    'Icono propio en la pantalla de inicio.',
                    'Apertura a pantalla completa.',
                    'La misma cuenta y los mismos datos de la web.',
                    'Pantalla informativa si pierdes la conexión.',
                  ].map((benefit) => (
                    <li key={benefit} className="flex gap-3">
                      <Check
                        size={17}
                        className="mt-1 shrink-0 text-orange-300"
                        aria-hidden="true"
                      />
                      {benefit}
                    </li>
                  ))}
                </ul>
                <p className="mt-6 border-t border-white/8 pt-5 text-xs leading-6 text-zinc-500">
                  En esta primera versión no se guardan estadísticas privadas para consultarlas sin
                  conexión y no se solicitan permisos de notificaciones.
                </p>
              </aside>
            </div>
          )}

          <div className="flex flex-col gap-3 border-t border-white/8 px-5 py-5 text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <span>Compatible con iOS, iPadOS y Android modernos.</span>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 text-zinc-300 hover:text-white"
            >
              Abrir inicio de sesión <ExternalLink size={14} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
