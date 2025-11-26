'use client';

/**
 * Market Page - Interactive Client Component
 * 
 * This is a CLIENT COMPONENT that:
 * - Fetches data from /api/market
 * - Allows interactive filtering and searching
 * - Updates without page reload
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function MarketPage() {
  // State management (datos que pueden cambiar)
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('timestamp');
  const [sortOrder, setSortOrder] = useState('desc');
  
  // Fetch data from API when component mounts
  useEffect(() => {
    fetchMarketData();
  }, []);
  
  /**
   * Fetch data from our API
   */
  async function fetchMarketData() {
    try {
      setLoading(true);
      const response = await fetch('/api/market?limit=100');
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }
  
  // Filter transfers based on search term (INTERACTIVITY)
  const filteredTransfers = data?.transfers?.filter(transfer => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    return (
      transfer.comprador?.toLowerCase().includes(search) ||
      transfer.vendedor?.toLowerCase().includes(search)
    );
  }) || [];
  
  // Sort transfers (INTERACTIVITY)
  const sortedTransfers = [...filteredTransfers].sort((a, b) => {
    let aVal = a[sortBy];
    let bVal = b[sortBy];
    
    if (sortOrder === 'asc') {
      return aVal > bVal ? 1 : -1;
    } else {
      return aVal < bVal ? 1 : -1;
    }
  });
  
  // Handle sort column click (INTERACTIVITY)
  function handleSort(column) {
    if (sortBy === column) {
      // Toggle order if clicking same column
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('desc');
    }
  }
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white text-xl">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-500 mx-auto mb-4"></div>
          Cargando datos del mercado...
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 text-center">
          <p className="text-red-400 text-xl mb-2">❌ Error</p>
          <p className="text-red-300">{error}</p>
          <button 
            onClick={fetchMarketData}
            className="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">
            💰 Análisis de Mercado
          </h1>
          <p className="text-slate-400">
            Transferencias, tendencias y estadísticas
          </p>
        </div>
        
        <button
          onClick={fetchMarketData}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
        >
          🔄 Actualizar
        </button>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <KPICard
          label="Total Fichajes"
          value={data.kpis.total_transfers}
          icon="📊"
          color="blue"
        />
        <KPICard
          label="Valor Medio"
          value={`${(data.kpis.avg_value || 0).toLocaleString('es-ES')}€`}
          icon="💶"
          color="green"
        />
        <KPICard
          label="Fichaje Récord"
          value={`${(data.kpis.max_value || 0).toLocaleString('es-ES')}€`}
          icon="🏆"
          color="amber"
        />
        <KPICard
          label="Compradores"
          value={data.kpis.active_buyers}
          icon="👥"
          color="purple"
        />
      </div>
      
      {/* Interactive Search (INTERACTIVITY) */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 p-6">
        <h2 className="text-xl font-bold text-white mb-4">
          🔍 Búsqueda Interactiva
        </h2>
        <input
          type="text"
          placeholder="Buscar por comprador o vendedor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-green-500 transition-colors"
        />
        <p className="text-slate-400 text-sm mt-2">
          Mostrando {sortedTransfers.length} de {data.transfers.length} transferencias
        </p>
      </div>
      
      {/* Transfers Table */}
      <div className="bg-slate-800 rounded-lg border border-slate-700 overflow-hidden">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white mb-4">
            📋 Historial de Transferencias
          </h2>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900 border-y border-slate-700">
              <tr>
                <th 
                  onClick={() => handleSort('fecha')}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                >
                  Fecha {sortBy === 'fecha' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Comprador
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Vendedor
                </th>
                <th 
                  onClick={() => handleSort('precio')}
                  className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                >
                  Precio {sortBy === 'precio' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Pujas
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {sortedTransfers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-8 text-center text-slate-400">
                    No se encontraron transferencias
                  </td>
                </tr>
              ) : (
                sortedTransfers.slice(0, 50).map((transfer, index) => (
                  <tr key={transfer.id || index} className="hover:bg-slate-700/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {new Date(transfer.fecha).toLocaleDateString('es-ES')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-400">
                      {transfer.comprador || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                      {transfer.vendedor || 'Mercado'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-amber-400">
                      {transfer.precio?.toLocaleString('es-ES')}€
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                      {transfer.pujas || 0}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Info Box */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-blue-400 text-2xl mr-3">ℹ️</span>
          <div>
            <h3 className="text-blue-300 font-semibold mb-1">
              Página Interactiva con API
            </h3>
            <p className="text-blue-200 text-sm">
              Esta página es un <strong>Client Component</strong> que consume la API <code className="bg-blue-900/30 px-1 rounded">/api/market</code>.
              Puedes buscar y ordenar sin recargar la página - todo sucede en tu navegador!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// KPI Card Component
function KPICard({ label, value, icon, color }) {
  const colors = {
    blue: 'border-blue-500/20 bg-blue-500/5',
    green: 'border-green-500/20 bg-green-500/5',
    amber: 'border-amber-500/20 bg-amber-500/5',
    purple: 'border-purple-500/20 bg-purple-500/5',
  };
  
  return (
    <div className={`${colors[color]} border rounded-lg p-4`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-slate-400 text-sm mb-1">{label}</div>
      <div className="text-white text-2xl font-bold">{value}</div>
    </div>
  );
}
