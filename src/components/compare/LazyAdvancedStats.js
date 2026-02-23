'use client';

import { useState } from 'react';
import { Zap } from 'lucide-react';

export default function LazyAdvancedStats({ onLoadAdvanced, onAdvancedStatsLoaded, isLoading }) {
  const [error, setError] = useState(null);

  const handleLoadAdvanced = async () => {
    try {
      setError(null);
      onLoadAdvanced();

      const response = await fetch('/api/compare/data');
      if (!response.ok) {
        throw new Error('Failed to fetch advanced statistics');
      }

      const result = await response.json();
      if (result.success) {
        onAdvancedStatsLoaded(result.data.advancedStats);
      } else {
        throw new Error(result.message || 'Failed to load advanced statistics');
      }
    } catch (err) {
      console.error('Error loading advanced stats:', err);
      setError(err.message || 'Error loading advanced statistics');
      onAdvancedStatsLoaded(null);
    }
  };

  return (
    <div className="mt-12 p-6 border border-zinc-700 rounded-lg bg-zinc-900 bg-opacity-50">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-400" />
            Estadísticas Avanzadas
          </h3>
          <p className="text-sm text-zinc-400 mt-1">
            Analiza métricas avanzadas como modas, consistencia, eficiencia y más.
          </p>
        </div>
        <button
          onClick={handleLoadAdvanced}
          disabled={isLoading}
          className={`px-4 py-2 rounded font-medium transition ${
            isLoading
              ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
              : 'bg-amber-500 hover:bg-amber-600 text-black'
          }`}
        >
          {isLoading ? 'Cargando...' : 'Cargar Análisis'}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-900 bg-opacity-30 border border-red-700 rounded text-red-400 text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
