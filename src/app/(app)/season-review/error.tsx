'use client';

export default function SeasonReviewError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-[70vh] grid place-items-center px-6">
      <div className="max-w-lg rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center">
        <p className="text-xs font-black uppercase tracking-[0.3em] text-red-400">
          Datos no disponibles
        </p>
        <h1 className="mt-3 text-3xl font-black text-white">No pudimos abrir el análisis</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          La temporada no se ha modificado. Prueba de nuevo para volver a cargar el informe
          congelado.
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-xl bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-orange-400"
        >
          Reintentar
        </button>
      </div>
    </main>
  );
}
