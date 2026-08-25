import Image from 'next/image';
import Link from 'next/link';
import { RefreshCw, WifiOff } from 'lucide-react';

export const metadata = {
  title: 'Sin conexión | Biwenger Stats',
};

export default function OfflinePage() {
  return (
    <main className="offline-page">
      <section className="offline-card">
        <div className="relative mx-auto h-20 w-20 overflow-hidden rounded-2xl border border-white/10 bg-black">
          <Image src="/icons/icon-192.png" alt="" fill sizes="80px" className="object-cover" />
        </div>
        <div className="mx-auto mt-6 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-zinc-400">
          <WifiOff size={23} aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-4xl text-white">Sin conexión</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-zinc-400">
          Necesitas conexión para consultar las estadísticas. No guardamos datos privados en este
          dispositivo.
        </p>
        <Link href="/dashboard" className="offline-retry-button">
          <RefreshCw size={18} aria-hidden="true" /> Reintentar
        </Link>
      </section>
    </main>
  );
}
