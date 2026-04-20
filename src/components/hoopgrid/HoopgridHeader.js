'use client';

/**
 * Centered header section for the Hoopgrid game.
 */
export default function HoopgridHeader({ diffDays, challengeDate }) {
  const formattedDate = challengeDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="w-full max-w-3xl flex flex-col items-center mb-8 text-center px-2">
      <h2 className="text-3xl md:text-4xl font-display uppercase tracking-tighter text-foreground leading-none">
        Reto #{diffDays}
      </h2>
      <p className="text-muted-foreground text-[10px] md:text-xs uppercase font-bold tracking-widest mt-1 opacity-70">
        {formattedDate}
      </p>
    </div>
  );
}
