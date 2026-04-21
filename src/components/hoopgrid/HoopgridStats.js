'use client';

import AnimatedNumber from '@/components/ui/AnimatedNumber';

export default function HoopgridStats({ guesses, correctGuessesCount, complexity = 0 }) {
  const averageRarity =
    correctGuessesCount > 0
      ? (
          Object.values(guesses)
            .filter((g) => g.isCorrect)
            .reduce((acc, curr) => acc + (curr.rarity || 0), 0) / correctGuessesCount
        ).toFixed(1)
      : '0.0';

  const getComplexityColor = (comp) => {
    // Hue: 120 (Green) to 0 (Red)
    const hue = Math.max(0, Math.min(120, 120 - comp * 1.2));
    return `hsl(${hue}, 80%, 50%)`;
  };

  return (
    <div className="w-full max-w-3xl grid grid-cols-3 gap-2 md:gap-4 mb-8">
      <div className="bg-card/40 border border-border/50 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm">
        <div className="text-xl md:text-3xl font-display text-primary tracking-tighter">
          <AnimatedNumber value={parseFloat(averageRarity)} />%
        </div>
        <p className="text-muted-foreground text-[10px] md:text-xs uppercase font-bold tracking-tighter mt-1">
          Rarity Promedio
        </p>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm">
        <div
          className="text-xl md:text-3xl font-display tracking-tighter"
          style={{ color: getComplexityColor(complexity) }}
        >
          <AnimatedNumber value={complexity} />
        </div>
        <p className="text-muted-foreground text-[10px] md:text-xs uppercase font-bold tracking-tighter mt-1">
          Complejidad
        </p>
      </div>

      <div className="bg-card/40 border border-border/50 rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center text-center shadow-lg backdrop-blur-sm">
        <div className="text-xl md:text-3xl font-display text-foreground tracking-tighter">
          {correctGuessesCount}/9
        </div>
        <p className="text-muted-foreground text-[10px] md:text-xs uppercase font-bold tracking-tighter mt-1">
          Aciertos
        </p>
      </div>
    </div>
  );
}
