'use client';

import { Users } from 'lucide-react';
import { Dropdown } from '@/components/ui/Dropdown';
import { cn } from '@/lib/utils';

export function TeamSelector({ teams, selectedTeamId, onTeamChange, className }) {
  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  return (
    <div
      className={cn(
        'flex items-center p-1 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl shadow-black/50',
        className
      )}
    >
      <Dropdown
        icon={<Users size={16} />}
        label={selectedTeam ? selectedTeam.name : 'Todos los Equipos'}
        align="center"
        className="min-w-[180px]"
      >
        {(close) => (
          <div className="max-h-[400px] overflow-y-auto sidebar-scroll">
            <div className="px-3 py-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest border-b border-zinc-800 sticky top-0 bg-zinc-950 z-50">
              Equipos
            </div>
            <div className="p-1">
              <button
                onClick={() => {
                  onTeamChange(null);
                  close();
                }}
                className={cn(
                  'w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 transition-colors my-0.5 cursor-pointer',
                  selectedTeamId === null
                    ? 'bg-zinc-800 text-white font-medium'
                    : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                )}
              >
                <div className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] font-bold">
                  ALL
                </div>
                Todos los Equipos
              </button>

              {teams.map((team) => (
                <button
                  key={team.id}
                  onClick={() => {
                    onTeamChange(team.id);
                    close();
                  }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm rounded-md flex items-center gap-3 transition-colors my-0.5 cursor-pointer',
                    team.id === selectedTeamId
                      ? 'bg-zinc-800 text-white font-medium'
                      : 'text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200'
                  )}
                >
                  <img src={team.img} alt="" className="w-6 h-6 object-contain" />
                  <span className="truncate">{team.name}</span>
                  {team.id === selectedTeamId && (
                    <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}
      </Dropdown>
    </div>
  );
}
