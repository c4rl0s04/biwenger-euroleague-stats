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
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableIdentity,
} from '@/components/ui';

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
        limit: '8',
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
            <span className="text-xs md:text-sm text-slate-500 font-bold font-sans">
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
                className="w-full bg-card/40 text-xs md:text-sm rounded-xl border border-border pl-9 pr-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-slate-500 transition-all font-sans"
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
                className="w-full bg-card/40 text-xs md:text-sm rounded-xl border border-border pl-9 pr-3 py-2.5 focus:ring-1 focus:ring-primary focus:outline-none placeholder:text-slate-500 transition-all font-sans"
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
              <Table>
                <TableHeader>
                  <TableRow hovering={false}>
                    <TableHeaderCell align="left">Fecha</TableHeaderCell>
                    <TableHeaderCell align="left">Jugador</TableHeaderCell>
                    <TableHeaderCell align="left">Operación</TableHeaderCell>
                    <TableHeaderCell align="right">Precio</TableHeaderCell>
                  </TableRow>
                </TableHeader>
                <tbody className="divide-y divide-white/5 bg-transparent">
                  {dayKeys.map((day) => [
                    <TableRow key={day} hovering={false} className="sticky top-[52px] z-20">
                      <TableCell
                        colSpan="4"
                        align="left"
                        className="py-2.5 px-4 text-[10px] md:text-sm font-bold text-slate-400 tracking-wider uppercase sticky left-0 bg-white/[0.03] backdrop-blur-md border-b border-white/5 shadow-sm"
                      >
                        {day}
                      </TableCell>
                    </TableRow>,
                    ...grouped[day].map((t) => {
                      const pos = POS_ICON[t.player_position] || POS_ICON.Unknown;
                      return (
                        <TableRow key={t.id}>
                          {/* Fecha (vacío, ya está el header de grupo) */}
                          <TableCell
                            align="left"
                            className="text-[10px] text-muted-foreground/40 font-display font-black"
                          ></TableCell>

                          {/* Jugador */}
                          <TableCell align="left">
                            <TableIdentity
                              name={t.player_name}
                              image={t.player_img}
                              link={`/player/${t.player_id}`}
                              size="sm"
                              subtitle={t.player_position}
                            />
                          </TableCell>

                          {/* Operación */}
                          <TableCell align="left">
                            <div className="flex items-center gap-3 text-xs">
                              {/* Vendedor icono */}
                              <span title={t.vendedor} className="flex items-center gap-1.5">
                                {t.vendedor === 'Mercado' ? (
                                  <span
                                    className="bg-orange-500/10 rounded-full p-1.5 text-orange-400 border border-orange-500/30 font-bold"
                                    title="Mercado"
                                  >
                                    M
                                  </span>
                                ) : (
                                  <TableIdentity
                                    name={t.vendedor}
                                    image={t.vendedor_icon}
                                    link={`/user/${t.vendedor_id}`}
                                    color={
                                      getColorForUser(
                                        t.vendedor_id,
                                        t.vendedor,
                                        t.vendedor_color_index
                                      ).text
                                    }
                                    size="sm"
                                  />
                                )}
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
                                    className="bg-orange-500/10 rounded-full p-1.5 text-orange-400 border border-orange-500/30 font-bold"
                                    title="Mercado"
                                  >
                                    M
                                  </span>
                                ) : (
                                  <TableIdentity
                                    name={t.comprador}
                                    image={t.comprador_icon}
                                    link={`/user/${t.comprador_id}`}
                                    color={
                                      getColorForUser(
                                        t.comprador_id,
                                        t.comprador,
                                        t.comprador_color_index
                                      ).text
                                    }
                                    size="sm"
                                  />
                                )}
                              </span>
                              {/* Badge pujas */}
                              {t.bids_count > 1 && (
                                <span className="ml-1 px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[9px] font-bold font-sans border border-purple-500/20 shadow-[0_0_10px_rgba(168,85,247,0.2)]">
                                  🔥 {t.bids_count}
                                </span>
                              )}
                            </div>
                          </TableCell>

                          {/* Precio */}
                          <TableCell align="right" className="tabular-nums">
                            {formatEuro(t.precio)}{' '}
                            <span className="text-[10px] opacity-50 ml-0.5">€</span>
                          </TableCell>
                        </TableRow>
                      );
                    }),
                  ])}
                  {!tableData.transfers.length && !loading && (
                    <TableRow hovering={false}>
                      <TableCell
                        colSpan="4"
                        className="text-center py-12 text-slate-500 font-sans uppercase tracking-widest font-bold opacity-50"
                      >
                        No se encontraron fichajes
                      </TableCell>
                    </TableRow>
                  )}
                </tbody>
              </Table>
            );
          })()}
        </div>

        {/* Pagination (bottom) */}
        <div className="mt-8 pt-6 border-t border-border flex items-center justify-between">
          <span className="text-xs md:text-sm text-slate-500 font-bold font-sans">
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
