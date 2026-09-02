import type { ComponentType } from 'react';
import { BackButton } from '@/components/ui';

const TeamBackButton = BackButton as ComponentType<{
  label?: string;
  className?: string;
  iconSize?: number;
  href?: string;
}>;

export function TeamProfileLoadingScreen() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center gap-4">
        <div className="w-16 h-16 bg-muted rounded-full"></div>
        <div className="h-4 w-32 bg-muted rounded"></div>
      </div>
    </div>
  );
}

export function TeamProfileNotFoundScreen() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 text-center">
      <h1 className="text-2xl font-bold mb-2 text-white">Equipo no encontrado</h1>
      <p className="text-white/40 mb-6">No hemos podido encontrar el equipo que buscas.</p>
      <TeamBackButton label="Volver atrás" className="text-blue-400 hover:underline" />
    </div>
  );
}
