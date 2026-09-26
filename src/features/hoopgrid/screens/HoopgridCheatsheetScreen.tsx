import Image from 'next/image';
import HoopgridCheatsheetHeader from '../components/HoopgridCheatsheetHeader';
import { HoopgridCheatsheetData } from '../models/hoopgrid.models';

export function HoopgridCheatsheetScreen({
  data,
  phone = false,
}: {
  data: HoopgridCheatsheetData;
  phone?: boolean;
}) {
  const { allChallenges, currentDate, currentNumber, prevDate, nextDate, isLatest, solutions } =
    data;

  return (
    <div
      className={`min-h-screen bg-background text-foreground font-sans ${phone ? 'mobile-cheatsheet-page' : 'p-6 md:p-10'}`}
    >
      <div className="max-w-7xl mx-auto">
        <HoopgridCheatsheetHeader
          allChallenges={allChallenges}
          currentDate={currentDate}
          currentNumber={currentNumber}
          prevDate={prevDate}
          nextDate={nextDate}
          isLatest={isLatest}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {solutions.map((cell, idx) => (
            <div
              key={idx}
              className="flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm md:h-[650px]"
            >
              <div className="p-5 border-b border-border bg-muted/30">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-black text-primary uppercase tracking-widest">
                    Cell {idx + 1}
                  </span>
                  <span className="text-xs font-bold text-muted-foreground uppercase">
                    {cell.players.length} Results
                  </span>
                </div>
                <h2 className="text-lg font-bold truncate">
                  {cell.rowLabel} <span className="text-muted-foreground mx-1">×</span>{' '}
                  {cell.colLabel}
                </h2>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 sidebar-scroll">
                {cell.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center gap-4 p-2.5 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                  >
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted border border-border shrink-0">
                      {player.img ? (
                        <Image src={player.img} alt={player.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] font-black opacity-20">
                          N/A
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm truncate">{player.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
                        <span>{player.teamId}</span>
                        <span className="text-primary font-bold">
                          {new Intl.NumberFormat('es-ES', {
                            style: 'currency',
                            currency: 'EUR',
                            maximumFractionDigits: 0,
                          }).format(player.price || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default HoopgridCheatsheetScreen;
