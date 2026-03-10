'use client';

import { useState } from 'react';
import { useApiData } from '@/lib/hooks/useApiData';
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
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({ buyer: '', seller: '' });
  const [appliedFilters, setAppliedFilters] = useState({ buyer: '', seller: '' });

  const defaultData = initialData || { transfers: [], page: 1, totalPages: 1 };

  const { data, loading, refetch } = useApiData(
    () => {
      const query = new URLSearchParams({
        page: String(page),
        ...(appliedFilters.buyer && { buyer: appliedFilters.buyer }),
        ...(appliedFilters.seller && { seller: appliedFilters.seller }),
      });

      return `/api/market/transfers?${query.toString()}`;
    },
    {
      dependencies: [page, appliedFilters.buyer, appliedFilters.seller],
      cacheKey: `market-transfers-${page}-${appliedFilters.buyer || 'all'}-${appliedFilters.seller || 'all'}`,
    }
  );

  const tableData = data || defaultData;

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleSearch = (e) => {
    e.preventDefault();

    const nextFilters = {
      buyer: filters.buyer.trim(),
      seller: filters.seller.trim(),
    };

    const sameFilters =
      nextFilters.buyer === appliedFilters.buyer && nextFilters.seller === appliedFilters.seller;

    if (page !== 1) {
      setPage(1);
    }

    if (!sameFilters) {
      setAppliedFilters(nextFilters);
      return;
    }

    if (page === 1) {
      refetch();
    }
  };

  const formatEuro = (val) => val.toLocaleString('es-ES', { maximumFractionDigits: 0 });

  // Utilidad para asignar un color único a cada usuario (hash simple)
  const userColor = (name) => {
    if (!name || name === 'Mercado') return 'text-orange-400';
    // Paleta de colores pastel
    const palette = [
      'text-blue-400',
      'text-green-400',
      'text-pink-400',
      'text-yellow-400',
      'text-purple-400',
      'text-emerald-400',
      'text-cyan-400',
      'text-fuchsia-400',
      'text-lime-400',
      'text-sky-400',
      'text-red-400',
      'text-indigo-400',
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % palette.length;
    return palette[idx];
  };

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

        {/* Tabla compacta con iconografía */}
        <div className="relative min-h-100 flex-1 overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 bg-zinc-900/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-xl">
              <Loader2 className="animate-spin text-orange-400 w-7 h-7" />
            </div>
          )}
          {/* Agrupar transfers por día */}
          {(() => {
            // Utilidad para agrupar transfers por fecha (día)
            const groupByDay = (arr) => {
              return arr.reduce((acc, t) => {
                const day = new Date(t.fecha).toLocaleDateString('es-ES', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });
                if (!acc[day]) acc[day] = [];
                acc[day].push(t);
                return acc;
              }, {});
            };
            const grouped = groupByDay(tableData.transfers);
            const dayKeys = Object.keys(grouped).sort((a, b) => {
              // Más reciente primero
              const da = new Date(a.split(' ').reverse().join('-'));
              const db = new Date(b.split(' ').reverse().join('-'));
              return db - da;
            });
            // Mapeo de posición a icono/estilo
            const POS_ICON = {
              Base: { color: 'bg-blue-500/90 border-blue-300', label: 'B' },
              Alero: { color: 'bg-green-500/90 border-green-300', label: 'A' },
              Pivot: { color: 'bg-red-500/90 border-red-300', label: 'P' },
              Unknown: { color: 'bg-zinc-500/80 border-zinc-300', label: '?' },
            };
            return (
              <table className="w-full text-sm text-left rounded-xl overflow-hidden border border-white/10 bg-transparent shadow-xl">
                <thead className="text-xs text-zinc-400 uppercase border-b border-white/10 sticky top-0 bg-transparent z-10">
                  <tr>
                    <th className="px-3 py-3 font-semibold tracking-wide">Fecha</th>
                    <th className="px-3 py-3 font-semibold tracking-wide">Jugador</th>
                    <th className="px-3 py-3 font-semibold tracking-wide">Operación</th>
                    <th className="px-3 py-3 font-semibold tracking-wide text-right">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10 bg-transparent">
                  {dayKeys.map((day) => [
                    <tr key={day} className="sticky top-8 z-5">
                      <td
                        colSpan="4"
                        className="py-2 px-3 text-xs font-bold text-orange-200 tracking-wide sticky left-0 bg-transparent shadow-sm border-b border-orange-300/20"
                      >
                        {day}
                      </td>
                    </tr>,
                    ...grouped[day].map((t) => {
                      const pos = POS_ICON[t.player_position] || POS_ICON.Unknown;
                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-orange-900/10 transition-colors group bg-transparent"
                        >
                          {/* Fecha (vacío, ya está el header) */}
                          <td className="px-3 py-3 whitespace-nowrap text-xs text-zinc-500 font-mono"></td>
                          {/* Jugador */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-zinc-800 border border-white/10 shadow-sm">
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
                              <span
                                className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-[11px] font-bold text-white shadow-sm ${pos.color}`}
                              >
                                {pos.label}
                              </span>
                              <span className="font-bold text-zinc-100 text-xs truncate max-w-45 md:max-w-60">
                                {t.player_name}
                              </span>
                            </div>
                          </td>
                          {/* Operación con iconos */}
                          <td className="px-3 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2 text-xs">
                              {/* Vendedor icono */}
                              <span title={t.vendedor} className="flex items-center gap-1">
                                {t.vendedor === 'Mercado' ? (
                                  <span
                                    className="bg-orange-400/10 rounded-full p-1 text-orange-400 border border-orange-300/30"
                                    title="Mercado"
                                  >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                                      <path
                                        d="M2 6l6-4 6 4v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                      />
                                    </svg>
                                  </span>
                                ) : (
                                  <span
                                    className="bg-red-400/10 rounded-full p-1 text-red-400 border border-red-300/30"
                                    title={t.vendedor}
                                  >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                                      <circle
                                        cx="8"
                                        cy="8"
                                        r="6"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                      />
                                      <path
                                        d="M8 5v3l2 2"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  </span>
                                )}
                                <span className="hidden md:inline">
                                  {t.vendedor !== 'Mercado' ? (
                                    <a
                                      href={`/user/${t.vendedor_id}`}
                                      className={`${userColor(t.vendedor)} hover:brightness-125 font-semibold transition-colors`}
                                      style={{ textDecoration: 'none' }}
                                    >
                                      {t.vendedor}
                                    </a>
                                  ) : (
                                    <span className="text-orange-400 font-semibold">
                                      {t.vendedor}
                                    </span>
                                  )}
                                </span>
                              </span>
                              <ArrowRight size={12} className="text-zinc-500" />
                              {/* Comprador icono */}
                              <span title={t.comprador} className="flex items-center gap-1">
                                {t.comprador === 'Mercado' ? (
                                  <span
                                    className="bg-orange-400/10 rounded-full p-1 text-orange-400 border border-orange-300/30"
                                    title="Mercado"
                                  >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                                      <path
                                        d="M2 6l6-4 6 4v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                      />
                                    </svg>
                                  </span>
                                ) : (
                                  <span
                                    className="bg-emerald-400/10 rounded-full p-1 text-emerald-400 border border-emerald-300/30"
                                    title={t.comprador}
                                  >
                                    <svg width="16" height="16" fill="none" viewBox="0 0 16 16">
                                      <circle
                                        cx="8"
                                        cy="8"
                                        r="6"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                      />
                                      <path
                                        d="M8 11V8l-2-2"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                        strokeLinecap="round"
                                      />
                                    </svg>
                                  </span>
                                )}
                                <span className="hidden md:inline">
                                  {t.comprador !== 'Mercado' ? (
                                    <a
                                      href={`/user/${t.comprador_id}`}
                                      className={`${userColor(t.comprador)} hover:brightness-125 font-semibold transition-colors`}
                                      style={{ textDecoration: 'none' }}
                                    >
                                      {t.comprador}
                                    </a>
                                  ) : (
                                    <span className="text-orange-400 font-semibold">
                                      {t.comprador}
                                    </span>
                                  )}
                                </span>
                              </span>
                              {/* Badge pujas */}
                              {t.bids_count > 1 && (
                                <span className="ml-1 px-1.5 py-0.5 rounded-full bg-purple-900/60 text-purple-200 text-[10px] font-mono animate-pulse border border-purple-400/30">
                                  🔥 {t.bids_count}
                                </span>
                              )}
                            </div>
                          </td>
                          {/* Precio */}
                          <td className="px-3 py-3 whitespace-nowrap text-right font-mono font-bold text-orange-300 group-hover:text-orange-100 relative">
                            <span className="transition-transform duration-150 group-hover:scale-110 cursor-pointer">
                              {formatEuro(t.precio)} €
                            </span>
                          </td>
                        </tr>
                      );
                    }),
                  ])}
                  {!tableData.transfers.length && !loading && (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-zinc-500">
                        No se encontraron fichajes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            );
          })()}
        </div>

        {/* Pagination */}
        <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
          <span className="text-xs text-zinc-500">
            Página <span className="text-zinc-300 font-mono">{page}</span> de{' '}
            <span className="text-zinc-300 font-mono">{tableData.totalPages}</span>
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((currentPage) => currentPage - 1)}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded bg-zinc-800 text-zinc-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-700 hover:text-white transition-colors"
            >
              <ArrowLeft size={14} />
            </button>
            <button
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={page >= tableData.totalPages || loading}
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
