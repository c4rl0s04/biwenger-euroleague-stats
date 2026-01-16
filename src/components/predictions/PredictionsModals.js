'use client';

import { X, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getColorForUser } from '@/lib/constants/colors';
import Link from 'next/link';

function ModalBase({ isOpen, onClose, title, icon, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-all duration-100 animate-in fade-in"
        onClick={onClose}
      />
      <div className="relative bg-card border border-border w-full max-w-lg rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-border flex justify-between items-center bg-muted/20">
          <h3 className="text-xl font-bold text-foreground flex items-center gap-3">
            {icon}
            {title}
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-full text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
}

export function ClutchModal({ isOpen, onClose, stats }) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Ranking Clutch"
      icon={<Zap className="w-6 h-6 text-blue-500" />}
    >
      <p className="text-sm text-muted-foreground mb-6">
        Promedio de aciertos en las últimas 3 jornadas. Jugadores que rinden bajo presión.
      </p>
      <div className="flex flex-col">
        {stats.map((c, idx) => {
          const colorInfo = getColorForUser(c.user_id, c.usuario, c.color_index);
          const userColor = colorInfo.text;

          let rankColor = 'text-muted-foreground/50';
          let rowClass = 'border-b border-border/40 hover:bg-muted/30';

          if (idx === 0) {
            rankColor = 'text-yellow-500';
            rowClass = 'border-b border-border/40 bg-yellow-500/5 hover:bg-yellow-500/10';
          } else if (idx === 1) {
            rankColor = 'text-slate-400';
            rowClass = 'border-b border-border/40 bg-slate-500/5 hover:bg-slate-500/10';
          } else if (idx === 2) {
            rankColor = 'text-orange-500';
            rowClass = 'border-b border-border/40 bg-orange-500/5 hover:bg-orange-500/10';
          } else if (idx === stats.length - 1) {
            rankColor = 'text-red-500';
          }

          return (
            <div
              key={idx}
              className={cn(
                'flex items-center justify-between py-3 px-4 transition-colors first:rounded-t-lg last:rounded-b-lg last:border-0',
                rowClass
              )}
            >
              <div className="flex items-center gap-4">
                <span className={cn('text-lg font-bold w-6 text-center tabular-nums', rankColor)}>
                  {idx + 1}
                </span>
                <Link
                  href={`/user/${c.user_id}`}
                  className={cn(
                    'font-black text-lg hover:opacity-80 transition-opacity',
                    userColor
                  )}
                >
                  {c.usuario}
                </Link>
              </div>
              <span className={cn('text-xl font-bold tabular-nums tracking-tight', userColor)}>
                {parseFloat(c.avg_last_3).toFixed(2)}
              </span>
            </div>
          );
        })}
      </div>
    </ModalBase>
  );
}

export function VictoriasModal({ isOpen, onClose, victorias }) {
  return (
    <ModalBase
      isOpen={isOpen}
      onClose={onClose}
      title="Ranking de Victorias"
      icon={<Trophy className="w-6 h-6 text-purple-500" />}
    >
      <p className="text-sm text-muted-foreground mb-6">
        Número total de jornadas ganadas por cada participante.
      </p>
      <div className="flex flex-col">
        {victorias.map((v, idx) => {
          const colorInfo = getColorForUser(v.user_id, v.usuario, v.color_index);
          const userColor = colorInfo.text;

          let rankColor = 'text-muted-foreground/50';
          let rowClass = 'border-b border-border/40 hover:bg-muted/30';

          if (idx === 0) {
            rankColor = 'text-yellow-500';
            rowClass = 'border-b border-border/40 bg-yellow-500/5 hover:bg-yellow-500/10';
          } else if (idx === 1) {
            rankColor = 'text-slate-400';
            rowClass = 'border-b border-border/40 bg-slate-500/5 hover:bg-slate-500/10';
          } else if (idx === 2) {
            rankColor = 'text-orange-500';
            rowClass = 'border-b border-border/40 bg-orange-500/5 hover:bg-orange-500/10';
          } else if (idx === victorias.length - 1) {
            rankColor = 'text-red-500';
          }

          return (
            <div
              key={idx}
              className={cn(
                'flex items-center justify-between py-3 px-4 transition-colors first:rounded-t-lg last:rounded-b-lg last:border-0',
                rowClass
              )}
            >
              <div className="flex items-center gap-4">
                <span className={cn('text-lg font-bold w-6 text-center tabular-nums', rankColor)}>
                  {idx + 1}
                </span>
                <Link
                  href={`/user/${v.user_id}`}
                  className={cn(
                    'font-black text-lg hover:opacity-80 transition-opacity',
                    userColor
                  )}
                >
                  {v.usuario}
                </Link>
              </div>
              <span className={cn('text-xl font-bold tabular-nums tracking-tight', userColor)}>
                {v.victorias}
              </span>
            </div>
          );
        })}
      </div>
    </ModalBase>
  );
}
