import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import CustomSelect from '@/components/ui/CustomSelect';

/**
 * Centered header section for the Hoopgrid game with navigation.
 */
export default function HoopgridHeader({
  diffDays,
  challengeDate,
  currentDateStr,
  prevDate,
  nextDate,
  allChallenges,
  isLatest,
  onNavigate,
  complexity,
  onOpenCalendar,
}) {
  const formattedDate = challengeDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getComplexityColor = (comp) => {
    const hue = Math.max(0, Math.min(120, 120 - comp * 1.2));
    return `hsl(${hue}, 80%, 50%)`;
  };

  const options = allChallenges.map((ch) => ({
    value: ch.gameDate,
    label: `Reto #${ch.number}`,
    sublabel: ch.gameDate,
    sideLabel: ch.complexity || 0,
    sideLabelColor: getComplexityColor(ch.complexity || 0),
  }));

  return (
    <div className="w-full max-w-3xl flex flex-col items-center mb-10 text-center px-4">
      <div className="flex items-center justify-center gap-4 md:gap-8 mb-2">
        <button
          onClick={() => onNavigate(prevDate)}
          className="p-3 rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary transition-all active:scale-90 cursor-pointer"
          title="Reto Anterior"
        >
          <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
        </button>

        <CustomSelect
          value={currentDateStr}
          onChange={onNavigate}
          options={options}
          placeholder={allChallenges.length > 0 ? `Reto #${diffDays}` : 'Cargando...'}
          className="min-w-[220px] md:min-w-[380px]"
          buttonClassName="!bg-transparent !border-none !h-auto !p-0 !text-4xl md:!text-6xl !font-display !uppercase !tracking-normal !text-white !leading-tight !justify-center hover:!text-primary transition-colors"
        />

        <button
          onClick={() => onNavigate(nextDate)}
          disabled={isLatest}
          className="p-3 rounded-full hover:bg-white/10 text-muted-foreground hover:text-primary transition-all active:scale-90 disabled:opacity-0 disabled:pointer-events-none cursor-pointer"
          title="Siguiente Reto"
        >
          <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
        </button>
      </div>

      <div className="flex items-center gap-3 mt-1">
        <p className="text-muted-foreground text-[10px] md:text-xs uppercase font-bold tracking-widest opacity-70">
          {formattedDate}
        </p>
        <button
          onClick={onOpenCalendar}
          className="p-1.5 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-primary transition-all active:scale-90 cursor-pointer"
          title="Ver Calendario"
        >
          <Calendar className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
