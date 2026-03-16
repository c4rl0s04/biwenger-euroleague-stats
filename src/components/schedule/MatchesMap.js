'use client';

import React from 'react';
import { Map as MapIcon } from 'lucide-react';

export default function MatchesMap({ roundName, matchCount }) {
  return (
    <div className="w-full bg-zinc-900/40 border border-zinc-800/50 rounded-xl overflow-hidden relative group min-h-[400px] flex flex-col items-center justify-center p-8 text-center transition-all duration-500 hover:border-zinc-700/50">
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center">
        <div className="mb-6 p-5 rounded-full bg-zinc-800/30 border border-zinc-700/50 shadow-2xl group-hover:scale-110 group-hover:bg-zinc-800/50 transition-all duration-700">
          <MapIcon className="w-10 h-10 text-blue-400 opacity-60 group-hover:opacity-100 transition-opacity" />
        </div>

        <h3 className="text-2xl font-bold text-zinc-100 mb-3 tracking-tight">
          Visualización Geográfica
        </h3>
        <p className="text-zinc-400 max-w-lg mx-auto leading-relaxed text-lg">
          Estamos preparando una vista interactiva para que puedas ver dónde se juegan los partidos
          de la <span className="text-blue-400/80 font-medium">{roundName || 'jornada'}</span>.
        </p>

        <div className="mt-8 flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-8 h-8 rounded-full bg-zinc-800 border-2 border-zinc-900 flex items-center justify-center"
              >
                <div
                  className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"
                  style={{ animationDelay: `${i * 200}ms` }}
                />
              </div>
            ))}
          </div>
          <span className="text-zinc-500 text-sm font-medium">
            Procesando {matchCount || 0} ubicaciones para este calendario...
          </span>
        </div>
      </div>
    </div>
  );
}
