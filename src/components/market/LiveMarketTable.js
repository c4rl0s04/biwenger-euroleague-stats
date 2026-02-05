'use client';

import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import {
  ArrowRight,
  Search,
  Filter,
  Loader2,
  ArrowLeft,
  ArrowRight as ArrowNext,
  RefreshCw,
} from 'lucide-react';
import Image from 'next/image';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';

const POS_COLORS = {
  Unknown: 'bg-slate-600',
  B: 'bg-blue-500',
  A: 'bg-emerald-500',
  P: 'bg-red-500',
  AP: 'bg-orange-500',
  E: 'bg-indigo-500',
};

export default function LiveMarketTable({ initialData }) {
  const [data, setData] = useState(initialData || { transfers: [], page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ buyer: '', seller: '' });

  const fetchTransfers = async (newPage, currentFilters) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page: newPage,
        ...(currentFilters.buyer && { buyer: currentFilters.buyer }),
        ...(currentFilters.seller && { seller: currentFilters.seller }),
      });
      const res = await apiClient.get(`/api/market/transfers?${query.toString()}`);
      if (res.success) {
        setData(res.data);
        setPage(newPage);
      }
    } catch (err) {
      console.error('Failed to load transfers', err);
    } finally {
      setLoading(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchTransfers(1, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchTransfers(1, filters);
  };

  const formatEuro = (val) => val.toLocaleString('es-ES', { maximumFractionDigits: 0 });

  return (
    <ElegantCard
      title="Mercado en Vivo"
      icon={RefreshCw}
      color="red"
      className="h-full"
      actionRight={
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="animate-spin w-4 h-4 text-zinc-500" />}
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Filters */}
        <div className="mb-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Filter className="absolute left-2 top-2.5 text-zinc-500 w-3 h-3" />
              <input
                type="text"
                name="buyer"
                placeholder="Comprador..."
                className="w-full bg-zinc-900 text-zinc-300 text-xs rounded-lg border border-white/5 pl-7 pr-2 py-2 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                value={filters.buyer}
                onChange={handleFilterChange}
              />
            </div>
            <div className="relative flex-1">
              <Filter className="absolute left-2 top-2.5 text-zinc-500 w-3 h-3" />
              <input
                type="text"
                name="seller"
                placeholder="Vendedor..."
                className="w-full bg-zinc-900 text-zinc-300 text-xs rounded-lg border border-white/5 pl-7 pr-2 py-2 focus:ring-1 focus:ring-orange-500 focus:outline-none"
                value={filters.seller}
                onChange={handleFilterChange}
              />
            </div>
            <button
              type="submit"
              className="bg-orange-600 hover:bg-orange-700 text-white px-3 rounded-lg transition-colors flex items-center justify-center"
            >
              <Search size={14} />
            </button>
          </form>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-x-auto min-h-[400px] relative">
          {loading && (
            <div className="absolute inset-0 bg-zinc-900/50 backdrop-blur-[1px] flex items-center justify-center z-10 rounded-lg">
              <Loader2 className="animate-spin text-orange-500 w-6 h-6" />
            </div>
          )}
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-zinc-500 uppercase border-b border-white/5">
              <tr>
                <th className="px-4 py-3 font-medium">Fecha</th>
                <th className="px-4 py-3 font-medium">Jugador</th>
                <th className="px-4 py-3 font-medium">Operación</th>
                <th className="px-4 py-3 font-medium text-right">Precio</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {data.transfers.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-4 py-3 whitespace-nowrap text-xs text-zinc-500 font-mono">
                    {new Date(t.fecha).toLocaleDateString('es-ES', {
                      day: '2-digit',
                      month: 'short',
                    })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-white/5">
                        {t.player_img && (
                          <Image
                            src={t.player_img}
                            alt={t.player_name}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span
                            className={`inline-flex items-center justify-center w-4 h-4 rounded text-[9px] font-bold text-white shadow-sm ${POS_COLORS[t.player_position] || POS_COLORS.Unknown}`}
                          >
                            {t.player_position}
                          </span>
                          <span className="font-bold text-zinc-200 text-xs">{t.player_name}</span>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-2 text-xs">
                      <span
                        className={`font-medium ${t.vendedor === 'Mercado' ? 'text-orange-400' : 'text-red-400'}`}
                      >
                        {t.vendedor}
                      </span>
                      <ArrowRight size={10} className="text-zinc-600" />
                      <span
                        className={`font-medium ${t.comprador === 'Mercado' ? 'text-orange-400' : 'text-emerald-400'}`}
                      >
                        {t.comprador}
                      </span>
                    </div>
                    {t.bids_count > 1 && (
                      <span className="text-[10px] text-purple-400 mt-0.5 block font-mono">
                        🔥 {t.bids_count} pujas
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right font-mono font-bold text-zinc-300 group-hover:text-white">
                    {formatEuro(t.precio)} €
                  </td>
                </tr>
              ))}
              {!data.transfers.length && !loading && (
                <tr>
                  <td colSpan="4" className="text-center py-8 text-zinc-500">
                    No se encontraron fichajes
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Página <span className="text-zinc-300 font-mono">{page}</span> de{' '}
            <span className="text-zinc-300 font-mono">{data.totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => fetchTransfers(page - 1, filters)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded bg-zinc-800 text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={() => fetchTransfers(page + 1, filters)}
              disabled={page >= data.totalPages || loading}
              className="p-1.5 rounded bg-zinc-800 text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <ArrowNext size={14} />
            </button>
          </div>
        </div>
      </div>
    </ElegantCard>
  );
}
