'use client';

import GridCell from './GridCell';

/**
 * The main 3x3 board for Hoopgrid, including headers.
 */
export default function HoopgridBoard({
  gridRef,
  challenge,
  guesses,
  activeCell,
  setActiveCell,
  isSubmitted,
  currentUser,
}) {
  if (!challenge) return null;

  return (
    <div
      ref={gridRef}
      className="hoopgrid-main-container w-full max-w-3xl flex flex-wrap mb-12 md:mb-16"
    >
      {/* Left Column: Row Headers */}
      <div className="w-[25%] md:w-[20%] flex flex-col pt-8 md:pt-14 pr-2 md:pr-6">
        {challenge.rows.map((row, i) => (
          <div
            key={`row-${i}`}
            className="flex-1 flex items-center justify-end text-right text-xs sm:text-sm md:text-lg lg:text-xl font-display text-muted-foreground leading-none uppercase"
          >
            {row.label}
          </div>
        ))}
      </div>

      {/* Center: Column Headers + 3x3 Grid */}
      <div className="w-[75%] md:w-[60%] flex flex-col">
        {/* Column Headers */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 mb-2 md:mb-4 h-8 md:h-14">
          {challenge.cols.map((col, i) => (
            <div
              key={`col-${i}`}
              className="flex items-end justify-center text-center text-xs sm:text-sm md:text-lg lg:text-xl font-display text-muted-foreground leading-tight uppercase pb-1 md:pb-2"
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* 3x3 Board */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 aspect-square">
          {[0, 1, 2].map((rowIdx) => (
            <div key={`row-group-${rowIdx}`} className="contents">
              {[0, 1, 2].map((colIdx) => {
                const cellIndex = rowIdx * 3 + colIdx;
                const guess = guesses[cellIndex];

                return (
                  <GridCell
                    key={`cell-${cellIndex}`}
                    guess={guess}
                    isGameSubmitted={isSubmitted}
                    onClick={() => !isSubmitted && setActiveCell(cellIndex)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Right Column: Empty spacer to perfectly center the board on desktop */}
      <div className="w-[25%] md:w-[20%] hidden md:block"></div>

      {/* GHOST FOOTER: Only visible in the shared image */}
      <div className="share-only-footer hidden w-full max-w-4xl mt-12 flex justify-between items-center px-4 opacity-40">
        <span className="text-[12px] font-bold uppercase tracking-widest text-muted-foreground">
          biwengerstats.com
        </span>
        <span className="text-[12px] font-display uppercase tracking-tighter text-foreground">
          Manager: {currentUser?.name || 'Invitado'}
        </span>
      </div>
    </div>
  );
}
