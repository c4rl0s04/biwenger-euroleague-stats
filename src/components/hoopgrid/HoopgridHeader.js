import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Centered header section for the Hoopgrid game with navigation.
 */
export default function HoopgridHeader({
  diffDays,
  challengeDate,
  prevDate,
  nextDate,
  isLatest,
  onNavigate,
}) {
  const formattedDate = challengeDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="w-full max-w-3xl flex flex-col items-center mb-8 text-center px-2">
      <div className="flex items-center gap-6 mb-1">
        <button
          onClick={() => onNavigate(prevDate)}
          className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-primary transition-all active:scale-90 cursor-pointer"
          title="Reto Anterior"
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        <h2 className="text-3xl md:text-5xl font-display uppercase tracking-tighter text-foreground leading-none">
          Reto #{diffDays}
        </h2>

        <button
          onClick={() => onNavigate(nextDate)}
          disabled={isLatest}
          className="p-2 rounded-full hover:bg-white/5 text-muted-foreground hover:text-primary transition-all active:scale-90 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
          title="Siguiente Reto"
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <p className="text-muted-foreground text-[10px] md:text-xs uppercase font-bold tracking-widest opacity-70">
        {formattedDate}
      </p>
    </div>
  );
}
