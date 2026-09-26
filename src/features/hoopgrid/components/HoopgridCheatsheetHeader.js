'use client';

import { useRouter } from 'next/navigation';
import CustomSelect from '@/components/ui/CustomSelect';

/**
 * Client-side header for the Cheatsheet page to support the dropdown navigation.
 */
export default function HoopgridCheatsheetHeader({
  allChallenges,
  currentDate,
  currentNumber,
  prevDate,
  nextDate,
  isLatest,
}) {
  const router = useRouter();

  const options = allChallenges.map((ch) => {
    // Difficulty calculation if available in data
    // For now we'll just use what we have
    return {
      value: ch.gameDate,
      label: `Reto #${ch.number}`,
      sublabel: ch.gameDate,
      sideLabel: ch.complexity || 0,
      sideLabelValue: ch.complexity || 0,
    };
  });

  const onNavigate = (date) => {
    router.push(`/hoopgrid-cheatsheet?date=${date}`);
  };

  return (
    <header className="mb-10 border-b border-border pb-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase tracking-tighter italic text-primary leading-none mb-4">
            Hoopgrid Cheatsheet
          </h1>

          <div className="flex items-center gap-6">
            <CustomSelect
              value={currentDate}
              onChange={onNavigate}
              options={options}
              placeholder={`Reto #${currentNumber}`}
              className="min-w-[200px] md:min-w-[300px]"
              buttonClassName="!bg-transparent !border-none !h-auto !p-0 !text-3xl md:!text-5xl !font-display !uppercase !tracking-normal !text-white !leading-tight hover:!text-primary transition-colors"
            />

            <div className="flex items-center gap-4">
              <button
                onClick={() => onNavigate(prevDate)}
                className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
              >
                ← Ant
              </button>
              {!isLatest && (
                <button
                  onClick={() => onNavigate(nextDate)}
                  className="text-xs font-bold uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors"
                >
                  Sig →
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="hidden md:block text-right">
          <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest opacity-50">
            Fecha del Reto
          </p>
          <p className="text-xl font-mono text-foreground">{currentDate}</p>
        </div>
      </div>
    </header>
  );
}
