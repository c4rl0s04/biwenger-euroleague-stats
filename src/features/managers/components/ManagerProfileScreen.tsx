import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ThemeBackground } from '@/components/ui';
import ManagerProfileClient from './ManagerProfileClient';
import MobileManagerProfileScreen from './MobileManagerProfileScreen';
import type { ManagerProfileResult } from '../models/manager-profile';

export default function ManagerProfileScreen({ result }: { result: ManagerProfileResult }) {
  if (result.kind === 'missing') {
    if (result.presentation === 'phone')
      return <div className="mobile-record-empty">Mánager no encontrado.</div>;
    return (
      <div className="p-6 text-center py-20">
        <h1 className="text-2xl font-bold text-white mb-4">Manager no encontrado</h1>
        <p className="text-muted-foreground mb-8 text-lg">
          El ID proporcionado no corresponde a ningún usuario activo en la liga.
        </p>
        <Link
          href="/standings"
          className="text-blue-400 hover:text-blue-300 flex items-center justify-center gap-2 font-bold"
        >
          <ArrowLeft className="w-5 h-5" /> Volver a la clasificación
        </Link>
      </div>
    );
  }
  if (result.kind === 'phone') return <MobileManagerProfileScreen {...result.data} />;
  return (
    <>
      <div className="fixed inset-0 z-0">
        <ThemeBackground />
      </div>
      <div className="relative z-10 p-6">
        <ManagerProfileClient {...result.data} />
      </div>
    </>
  );
}
