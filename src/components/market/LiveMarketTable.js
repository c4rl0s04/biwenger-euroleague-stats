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
import { getColorForUser } from '@/lib/constants/colors';

const POS_COLORS = {
  Unknown: 'bg-muted',
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

  return (
    <ElegantCard
      title="Mercado en Vivo"
      icon={RefreshCw}
      color="red"
      className="h-full"
      actionRight={
        <div className="flex items-center gap-2">
          {loading && <Loader2 className="animate-spin w-4 h-4 text-slate-500" />}
        </div>
      }
    >
      <div className="flex flex-col h-full">
        {/* Top Controls: Pagination + Filters */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Pagination Top */}
          <div className="flex items-center gap-4 order-2 md:order-1 justify-between md:justify-start">
            <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-display">
              Página <span className="text-white ml-1">{page}</span>{' '}
              <span className="mx-1 text-slate-700">/</span> {tableData.totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((currentPage) => currentPage - 1)}
                disabled={page <= 1 || loading}
                className="p-2 rounded-xl bg-card/50 text-slate-400 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-primary/20 hover:text-white transition-all duration-300 border border-border cursor-pointer shadow-sm active:scale-95"
              >
                <ArrowLeft size={16} />
              </button>
              <button
                onClick={() => setPage((currentPage) => currentPage + 1)}
                disabled={page >= tableData.totalPages || loading}
                className="p-2 rounded-xl bg-card/50 text-slate-400 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-primary/20 hover:text-white transition-all duration-300 border border-border cursor-pointer shadow-sm active:scale-95"
              >
                <ArrowNext size={16} />
              </button>
            </div>
          </div>
          {/* Filters */}
          <form onSubmit={handleSearch} className="flex gap-3 order-1 md:order-2">
            <div className="relative flex-1 min-w-[140px]">
              <Filter className="absolute left-3 top-2.5 text-slate-500 w-3.5 h-3.5" />
              <input
                type="text"
                name="buyer"
                placeholder="Comprador..."
                className="w-full bg-card/40 text-white text-xs md:text-sm rounded-xl border border-border pl-9 pr-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-slate-500 transition-all font-display tracking-tight font-black uppercase"
                value={filters.buyer}
                onChange={handleFilterChange}
              />
            </div>
            <div className="relative flex-1 min-w-[140px]">
              <Filter className="absolute left-3 top-2.5 text-slate-500 w-3.5 h-3.5" />
              <input
                type="text"
                name="seller"
                placeholder="Vendedor..."
                className="w-full bg-card/40 text-white text-xs md:text-sm rounded-xl border border-border pl-9 pr-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-slate-500 transition-all font-display tracking-tight font-black uppercase"
                value={filters.seller}
                onChange={handleFilterChange}
              />
            </div>
            <button
              type="submit"
              className="bg-primary hover:bg-primary/80 text-white px-4 rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-95 flex items-center justify-center cursor-pointer"
            >
              <Search size={16} />
            </button>
          </form>
        </div>

        {/* Tabla compacta con iconografía */}
        <div className="relative min-h-[400px] flex-1 overflow-x-auto">
          {loading && (
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center z-10 rounded-2xl">
              <Loader2 className="animate-spin text-primary w-8 h-8" />
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
              Alero: { color: 'bg-emerald-500/90 border-green-300', label: 'A' },
              Pivot: { color: 'bg-red-500/90 border-red-300', label: 'P' },
              Unknown: { color: 'bg-slate-500/80 border-slate-300', label: '?' },
            };
            return (
              <table className="w-full text-sm text-left rounded-2xl overflow-hidden border border-border bg-transparent">
                <thead className="text-[10px] md:text-xs text-slate-400 uppercase border-b border-border sticky top-0 bg-card/90 backdrop-blur-md z-10 font-display tracking-[0.1em]">
                  <tr>
                    <th className="px-4 py-4 font-black">Fecha</th>
                    <th className="px-4 py-4 font-black">Jugador</th>
                    <th className="px-4 py-4 font-black">Operación</th>
                    <th className="px-4 py-4 font-black text-right">Precio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 bg-transparent">
                  {dayKeys.map((day) => [
                    <tr key={day} className="sticky top-[52px] z-5">
                      <td
                        colSpan="4"
                        className="py-2.5 px-4 text-[10px] md:text-xs font-black text-primary/80 tracking-[0.15em] uppercase font-display sticky left-0 bg-card/60 backdrop-blur-sm border-b border-border"
                      >
                        {day}
                      </td>
                    </tr>,
                    ...grouped[day].map((t) => {
                      const pos = POS_ICON[t.player_position] || POS_ICON.Unknown;
                      return (
                        <tr
                          key={t.id}
                          className="hover:bg-white/[0.02] transition-colors group bg-transparent"
                        >
                          {/* Fecha (vacío, ya está el header) */}
                          <td className="px-4 py-4 whitespace-nowrap text-[10px] text-muted-foreground/40 font-display font-black"></td>
                          {/* Jugador */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3">
                              <div className="relative w-9 h-9 rounded-full overflow-hidden bg-white/5 border border-white/5 shadow-sm">
                                {t.player_img && (
                                  <Image
                                    src={t.player_img}
                                    alt={t.player_name}
                                    fill
                                    className="object-cover object-top scale-[1.8] origin-top translate-y-[10%] transition-transform group-hover:scale-[2.0]"
                                    sizes="36px"
                                  />
                                )}
                              </div>
                              <span
                                className={`inline-flex items-center justify-center w-5 h-5 rounded-full border text-[10px] font-black text-white shadow-sm font-display ${pos.color}`}
                              >
                                {pos.label}
                              </span>
                              <a
                                href={`/player/${t.player_id}`}
                                className="font-black text-white text-sm md:text-base truncate max-w-45 md:max-w-60 hover:text-primary transition-colors font-display tracking-tight"
                                style={{ textDecoration: 'none' }}
                              >
                                {t.player_name}
                              </a>
                            </div>
                          </td>
                          {/* Operación con iconos */}
                          <td className="px-4 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-3 text-xs">
                              {/* Vendedor icono */}
                              <span title={t.vendedor} className="flex items-center gap-1.5">
                                {t.vendedor === 'Mercado' ? (
                                  <span
                                    className="bg-orange-500/10 rounded-full p-1.5 text-orange-400 border border-orange-500/30"
                                    title="Mercado"
                                  >
                                    <svg width="14" height="14" fill="none" viewBox="0 0 16 16">
                                      <path
                                        d="M2 6l6-4 6 4v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                      />
                                    </svg>
                                  </span>
                                ) : (
                                  <span
                                    className="bg-red-500/10 rounded-full p-1.5 text-red-500 border border-red-500/30"
                                    title={t.vendedor}
                                  >
                                    <svg width="14" height="14" fill="none" viewBox="0 0 16 16">
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
                                      className={`${getColorForUser(t.vendedor_id, t.vendedor, t.vendedor_color_index).text} hover:brightness-125 font-black transition-colors font-display tracking-tight text-sm md:text-base`}
                                      style={{ textDecoration: 'none' }}
                                    >
                                      {t.vendedor}
                                    </a>
                                  ) : (
                                    <span className="text-orange-400 font-black font-display tracking-tight text-sm md:text-base">
                                      {t.vendedor}
                                    </span>
                                  )}
                                </span>
                              </span>
                              <ArrowRight
                                size={14}
                                title="hacia"
                                className="text-muted-foreground/30"
                              />
                              {/* Comprador icono */}
                              <span title={t.comprador} className="flex items-center gap-1.5">
                                {t.comprador === 'Mercado' ? (
                                  <span
                                    className="bg-orange-500/10 rounded-full p-1.5 text-orange-400 border border-orange-500/30"
                                    title="Mercado"
                                  >
                                    <svg width="14" height="14" fill="none" viewBox="0 0 16 16">
                                      <path
                                        d="M2 6l6-4 6 4v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"
                                        stroke="currentColor"
                                        strokeWidth="1.5"
                                      />
                                    </svg>
                                  </span>
                                ) : (
                                  <span
                                    className="bg-emerald-500/10 rounded-full p-1.5 text-emerald-400 border border-emerald-500/30"
                                    title={t.comprador}
                                  >
                                    <svg width="14" height="14" fill="none" viewBox="0 0 16 16">
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
                                      className={`${getColorForUser(t.comprador_id, t.comprador, t.comprador_color_index).text} hover:brightness-125 font-black transition-colors font-display tracking-tight text-sm md:text-base`}
                                      style={{ textDecoration: 'none' }}
                                    >
                                      {t.comprador}
                                    </a>
                                  ) : (
                                    <span className="text-orange-400 font-black font-display tracking-tight text-sm md:text-base">
                                      {t.comprador}
                                    </span>
                                  )}
                                </span>
                              </span>
                              {/* Badge pujas */}
                              {t.bids_count > 1 && (
                                <span className="ml-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[9px] font-black font-display border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                                  🔥 {t.bids_count}
                                </span>
                              )}
                            </div>
                          </td>
                          {/* Precio */}
                          <td className="px-4 py-4 whitespace-nowrap text-right font-display font-black text-primary text-base md:text-lg group-hover:text-white relative transition-all">
                            <span className="transition-transform duration-300 block group-hover:scale-110 origin-right">
                              {formatEuro(t.precio)}{' '}
                              <span className="text-[10px] md:text-xs opacity-50 ml-0.5 font-sans">
                                €
                              </span>
                            </span>
                          </td>
                        </tr>
                      );
                    }),
                  ])}
                  {!tableData.transfers.length && !loading && (
                    <tr>
                      <td
                        colSpan="4"
                        className="text-center py-12 text-slate-500 font-display uppercase tracking-widest font-black opacity-50"
                      >
                        No se encontraron fichajes
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            );
          })()}
        </div>

        {/* Pagination (bottom) */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
          <span className="text-[10px] text-slate-500 uppercase font-black tracking-widest font-display">
            Página <span className="text-white ml-1">{page}</span>{' '}
            <span className="mx-1 text-slate-700">/</span> {tableData.totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((currentPage) => currentPage - 1)}
              disabled={page <= 1 || loading}
              className="p-2 rounded-xl bg-card/50 text-slate-400 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-primary/20 hover:text-white transition-all duration-300 border border-border cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowLeft size={16} />
            </button>
            <button
              onClick={() => setPage((currentPage) => currentPage + 1)}
              disabled={page >= tableData.totalPages || loading}
              className="p-2 rounded-xl bg-card/50 text-slate-400 disabled:opacity-20 disabled:cursor-not-allowed hover:bg-primary/20 hover:text-white transition-all duration-300 border border-border cursor-pointer shadow-sm active:scale-95"
            >
              <ArrowNext size={16} />
            </button>
          </div>
        </div>
      </div>
    </ElegantCard>
  );
}
