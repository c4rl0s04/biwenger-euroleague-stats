'use client';

import { Card } from '@/components/ui';
import { Target, Trophy } from 'lucide-react';

export function PredictableTeamsCard({ teams }) {
  if (!teams || teams.length === 0) {
    return (
      <Card title="Equipos Predecibles" icon={Target} color="green" className="h-full">
        <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">
          No hay suficientes datos
        </div>
      </Card>
    );
  }

  return (
    <Card title="Equipos Predecibles" icon={Target} color="green" className="h-full">
      <div className="overflow-x-auto">
        <table className="w-full text-xs text-left">
          <thead>
            <tr className="text-muted-foreground border-b border-border/50">
              <th className="py-2 pl-1 font-medium">Equipo</th>
              <th className="py-2 px-1 text-center font-medium">%</th>
              <th className="py-2 px-1 text-center font-medium" title="Aciertos Totales">
                Ac.
              </th>
              <th className="py-2 px-1 text-center font-medium" title="Predicciones Totales">
                Tot.
              </th>
              <th
                className="py-2 px-1 text-center font-medium text-blue-400/80"
                title="Victorias Predichas (Total)"
              >
                V.P
              </th>
              <th
                className="py-2 px-1 text-center font-medium text-orange-400/80"
                title="Derrotas Predichas (Total)"
              >
                D.P
              </th>
              <th
                className="py-2 px-1 text-center font-medium text-green-500/80"
                title="Aciertos en Victoria"
              >
                V.Ac
              </th>
              <th
                className="py-2 px-1 text-center font-medium text-red-500/80"
                title="Aciertos en Derrota"
              >
                D.Ac
              </th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team, index) => {
              const isTop = index === 0;
              return (
                <tr
                  key={team.id}
                  className={`border-b border-border/30 last:border-0 hover:bg-muted/10 transition-colors ${isTop ? 'bg-green-500/5' : ''}`}
                >
                  <td className="py-2 pl-1 flex items-center gap-2">
                    <div className="relative w-6 h-6 shrink-0">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={team.img}
                        alt={team.name}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span
                      className={`truncate max-w-[100px] font-medium ${isTop ? 'text-green-500' : 'text-slate-300'}`}
                    >
                      {team.name}
                    </span>
                  </td>
                  <td className="py-2 px-1 text-center font-bold text-green-400">
                    {team.percentage}%
                  </td>
                  <td className="py-2 px-1 text-center text-slate-300">{team.correct}</td>
                  <td className="py-2 px-1 text-center text-muted-foreground">{team.total}</td>
                  <td className="py-2 px-1 text-center text-blue-400">{team.predicted_wins}</td>
                  <td className="py-2 px-1 text-center text-orange-400">{team.predicted_losses}</td>
                  <td className="py-2 px-1 text-center text-green-500 font-medium">
                    {team.correct_wins}
                  </td>
                  <td className="py-2 px-1 text-center text-red-500 font-medium">
                    {team.correct_losses}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
