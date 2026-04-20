'use client';

import GridCell from './GridCell';

export default function HoopgridBoard({
  gridRef,
  challenge,
  guesses,
  setActiveCell,
  isSubmitted,
  currentUser,
}) {
  if (!challenge) return null;

  return (
    <div ref={gridRef} className="hoopgrid-main-container w-full max-w-3xl flex flex-wrap mb-16">
      {/* Left Column: Row Headers */}
      <div className="w-[25%] md:w-[20%] flex flex-col pt-8 md:pt-14 pr-2 md:pr-6">
        {challenge.rows.map((row, i) => (
          <div
            key={`row-${i}`}
            className="flex-1 flex items-center justify-end text-right text-xs md:text-lg font-display text-muted-foreground leading-none uppercase"
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
              className="flex items-end justify-center text-center text-xs md:text-lg font-display text-muted-foreground leading-tight uppercase pb-1 md:pb-2"
            >
              {col.label}
            </div>
          ))}
        </div>

        {/* 3x3 Board */}
        <div className="grid grid-cols-3 gap-2 md:gap-4 aspect-square">
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <GridCell
              key={`cell-${i}`}
              guess={guesses[i]}
              isSubmitted={isSubmitted}
              onClick={() => !isSubmitted && setActiveCell(i)}
            />
          ))}
        </div>
      </div>

      {/* Right Column: Empty spacer for horizontal balancing on desktop */}
      <div className="w-[25%] md:w-[20%] hidden md:block"></div>
    </div>
  );
}
