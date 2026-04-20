'use client';

/**
 * Static instructions for the Hoopgrid game.
 */
export default function HoopgridInstructions() {
  return (
    <div className="w-full max-w-3xl bg-card/30 p-8 rounded-2xl border border-border/50 mb-10">
      <h3 className="text-foreground font-display mb-4 text-sm tracking-widest uppercase">
        Cómo jugar
      </h3>
      <ul className="space-y-4 text-muted-foreground text-sm leading-relaxed">
        <li className="flex gap-4">
          <span className="text-primary font-bold font-display">01.</span>
          <span>Busca un jugador que cumpla con los dos criterios (fila y columna).</span>
        </li>
        <li className="flex gap-4">
          <span className="text-primary font-bold font-display">02.</span>
          <span>
            Tienes <strong>intentos ilimitados</strong> para encontrar al jugador correcto.
          </span>
        </li>
        <li className="flex gap-4">
          <span className="text-primary font-bold font-display">03.</span>
          <span>
            El <strong>Rarity Score</strong> premia a los jugadores menos seleccionados por otros
            usuarios. ¡Cuanto más bajo, mejor!
          </span>
        </li>
      </ul>
    </div>
  );
}
