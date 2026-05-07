'use client';

import { Sparkles, Save, RotateCcw, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LineupControlBar({ loading, error, success, onSave, onReset }) {
  return (
    <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-md border-b border-white/5 py-4 -mx-6 px-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Title */}
        <div className="flex items-center gap-4">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold leading-none">Alineación Predeterminada</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Configura tu equipo para las próximas jornadas
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {error && (
            <div className="hidden md:flex items-center gap-2 text-rose-500 bg-rose-500/10 px-3 py-1.5 rounded-lg text-xs font-medium border border-rose-500/20">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {success && (
            <div className="hidden md:flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-3 py-1.5 rounded-lg text-xs font-medium border border-emerald-500/20">
              <CheckCircle2 size={14} />
              Guardado correctamente
            </div>
          )}

          <button
            onClick={onReset}
            className="p-2.5 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer border border-white/5"
            title="Restablecer"
          >
            <RotateCcw size={20} />
          </button>

          <button
            onClick={onSave}
            disabled={loading}
            className="flex items-center gap-2 bg-primary text-white px-6 py-2.5 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-primary/20 cursor-pointer"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span>Guardar cambios</span>
          </button>
        </div>
      </div>
    </div>
  );
}
