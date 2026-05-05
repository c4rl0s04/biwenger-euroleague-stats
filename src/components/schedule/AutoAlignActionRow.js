'use client';

import { Sparkles } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import AutoAlignButton from './AutoAlignButton';

/**
 * AutoAlignActionRow
 * A client-side wrapper for the automation row to handle icons and interactivity.
 */
export default function AutoAlignActionRow({ userId, matches, userName }) {
  if (!matches || matches.length === 0) return null;

  return (
    <div className="mt-8 mb-6 animate-in fade-in slide-in-from-left-4 duration-700">
      <ElegantCard
        title="Automatización"
        icon={Sparkles}
        color="indigo"
        bgColor="indigo"
        padding="p-4 md:p-8"
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="text-center lg:text-left">
            <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mb-2">
              Optimización de Alineación
            </h3>
            <p className="text-zinc-400 max-w-xl text-sm md:text-base leading-relaxed">
              Utiliza nuestro algoritmo para generar la alineación ideal. Seleccionamos
              automáticamente a los <span className="text-indigo-400 font-bold">5 titulares</span>{' '}
              más madrugadores y asignamos la capitanía basándonos en el rendimiento histórico de tu
              plantilla.
            </p>
          </div>
          <div className="w-full lg:w-auto shrink-0">
            <AutoAlignButton userId={userId} matches={matches} userName={userName} />
          </div>
        </div>
      </ElegantCard>
    </div>
  );
}
