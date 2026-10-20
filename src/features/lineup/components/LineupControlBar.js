'use client';

import { Save, RotateCcw, AlertCircle, CheckCircle2, Layout } from 'lucide-react';

export default function LineupControlBar({
  loading,
  error,
  success,
  currentType,
  onSave,
  onReset,
  onChangeType,
}) {
  return (
    <div className="flex flex-col items-center gap-2 w-full">
      {/* Status Messages (Centered) */}
      {(error || success) && (
        <div className="flex flex-col items-center gap-2">
          {error && (
            <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 px-4 py-1.5 rounded-full text-xs font-medium border border-rose-500/20 animate-in fade-in zoom-in duration-300">
              <AlertCircle size={14} />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 text-emerald-500 bg-emerald-500/10 px-4 py-1.5 rounded-full text-xs font-medium border border-emerald-500/20 animate-in fade-in zoom-in duration-300">
              <CheckCircle2 size={14} />
              Guardado correctamente
            </div>
          )}
        </div>
      )}

      {/* Buttons (Centered) */}
      <div className="flex items-center justify-center gap-4 w-full">
        <button
          onClick={onReset}
          className="p-3 rounded-xl bg-white/5 text-zinc-400 hover:bg-white/10 hover:text-white transition-all cursor-pointer border border-white/5 shadow-lg active:scale-95"
          title="Restablecer"
        >
          <RotateCcw size={20} />
        </button>

        <button
          onClick={onChangeType}
          className="flex items-center gap-3 bg-zinc-900 text-zinc-300 px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 hover:text-white transition-all border border-white/10 shadow-xl active:scale-95 cursor-pointer"
        >
          <Layout size={18} className="text-primary" />
          <span className="text-sm uppercase tracking-wider">
            Estrategia: <span className="text-white ml-1">{currentType}</span>
          </span>
        </button>

        <button
          onClick={onSave}
          disabled={loading}
          className="flex items-center gap-3 bg-primary text-white px-8 py-3 rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 shadow-xl shadow-primary/20 cursor-pointer"
        >
          {loading ? (
            <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Save size={20} />
          )}
          <span className="text-sm uppercase tracking-wider">Guardar cambios</span>
        </button>
      </div>
    </div>
  );
}
