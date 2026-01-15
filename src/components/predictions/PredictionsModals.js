'use client';

import { X, Trophy, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

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
      <p className="text-sm text-muted-foreground mb-4">
        Promedio de aciertos en las últimas 3 jornadas. Jugadores que rinden bajo presión.
      </p>
      <div className="space-y-3">
        {stats.map((c, idx) => {
          let iconColor = 'text-muted-foreground';
          let rankClass = 'text-muted-foreground font-bold';
          let cardClass = 'bg-card border-border/50';

          if (idx === 0) {
            iconColor = 'text-yellow-500';
            cardClass = 'bg-yellow-500/5 border-yellow-500/20';
          } else if (idx === 1) {
            iconColor = 'text-slate-400';
            cardClass = 'bg-slate-500/5 border-slate-500/20';
          } else if (idx === 2) {
            iconColor = 'text-orange-500';
            cardClass = 'bg-orange-500/5 border-orange-500/20';
          }

          return (
            <div
              key={idx}
              className={cn(
                'flex items-center justify-between p-4 border rounded-xl transition-colors hover:border-border',
                cardClass
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 flex justify-center">
                  {idx < 3 ? (
                    <Trophy className={cn('w-6 h-6', iconColor)} />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground/50">{idx + 1}</span>
                  )}
                </div>
                <span className="font-bold text-lg text-foreground">{c.usuario}</span>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={cn(
                    'text-2xl font-black',
                    idx === 0 ? 'text-blue-500' : 'text-foreground'
                  )}
                >
                  {parseFloat(c.avg_last_3).toFixed(2)}
                </span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Promedio
                </span>
              </div>
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
      <p className="text-sm text-muted-foreground mb-4">
        Número total de jornadas ganadas por cada participante.
      </p>
      <div className="space-y-3">
        {victorias.map((v, idx) => {
          let iconColor = 'text-muted-foreground';
          let cardClass = 'bg-card border-border/50';

          if (idx === 0) {
            iconColor = 'text-yellow-500';
            cardClass = 'bg-yellow-500/5 border-yellow-500/20';
          } else if (idx === 1) {
            iconColor = 'text-slate-400';
            cardClass = 'bg-slate-500/5 border-slate-500/20';
          } else if (idx === 2) {
            iconColor = 'text-orange-500';
            cardClass = 'bg-orange-500/5 border-orange-500/20';
          }

          return (
            <div
              key={idx}
              className={cn(
                'flex items-center justify-between p-4 border rounded-xl transition-colors hover:border-border',
                cardClass
              )}
            >
              <div className="flex items-center gap-4">
                <div className="w-8 flex justify-center">
                  {idx < 3 ? (
                    <Trophy className={cn('w-6 h-6', iconColor)} />
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground/50">{idx + 1}</span>
                  )}
                </div>
                <span className="font-bold text-lg text-foreground">{v.usuario}</span>
              </div>
              <div className="flex flex-col items-end">
                <span
                  className={cn(
                    'text-2xl font-black',
                    idx === 0 ? 'text-purple-500' : 'text-foreground'
                  )}
                >
                  {v.victorias}
                </span>
                <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Victorias
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </ModalBase>
  );
}
