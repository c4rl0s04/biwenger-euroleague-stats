'use client';

import { useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Check,
  X,
  Clock,
  TrendingUp,
  TrendingDown,
  HandCoins,
  ChevronLeft,
  ChevronRight,
  Search,
  LayoutGrid,
  List,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
} from 'lucide-react';
import {
  Table,
  TableHeader,
  TableRow,
  TableHeaderCell,
  TableCell,
  TableIdentity,
} from '@/components/ui/StatsTable';
import { formatCurrency } from '@/lib/utils/format';
import Image from 'next/image';

function getHoursLeft(until) {
  return Math.max(0, Math.floor((until - Math.floor(Date.now() / 1000)) / 3600));
}

function SortableHeader({ label, sortKey, currentSort, onSort, align = 'center', className }) {
  const isSorted = currentSort.key === sortKey;
  return (
    <TableHeaderCell
      align={align}
      className={`cursor-pointer select-none hover:bg-white/5 transition-colors ${className}`}
      onClick={() => {
        let direction = 'desc';
        if (isSorted && currentSort.direction === 'desc') direction = 'asc';
        onSort({ key: sortKey, direction });
      }}
    >
      <div
        className={`flex items-center gap-2 ${align === 'left' ? 'justify-start' : 'justify-center'}`}
      >
        {label}
        {isSorted ? (
          currentSort.direction === 'asc' ? (
            <ArrowUp size={12} className="text-emerald-500" />
          ) : (
            <ArrowDown size={12} className="text-emerald-500" />
          )
        ) : (
          <ArrowUpDown size={12} className="text-white/20" />
        )}
      </div>
    </TableHeaderCell>
  );
}

export default function LineupOffersSection({ squad, onAccept, onReject, loading }) {
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('carousel'); // 'carousel' | 'table'
  const [sortConfig, setSortConfig] = useState({ key: 'profit', direction: 'desc' });
  const scrollRef = useRef(null);

  // Filter, Search, and Sort players who have pending offers
  const playersWithOffers = useMemo(() => {
    let filtered = squad
      .filter((p) => p.offers && p.offers.length > 0)
      .filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

    filtered.sort((a, b) => {
      const offerA = a.offers[0].amount;
      const offerB = b.offers[0].amount;
      const purchasePriceA = a.owner?.price || 0;
      const purchasePriceB = b.owner?.price || 0;
      const currentPriceA = a.price || 0;
      const currentPriceB = b.price || 0;

      let valA, valB;
      switch (sortConfig.key) {
        case 'name':
          valA = a.name;
          valB = b.name;
          break;
        case 'investment':
          valA = purchasePriceA;
          valB = purchasePriceB;
          break;
        case 'price':
          valA = currentPriceA;
          valB = currentPriceB;
          break;
        case 'offer':
          valA = offerA;
          valB = offerB;
          break;
        case 'profitActual':
          valA = offerA - currentPriceA;
          valB = offerB - currentPriceB;
          break;
        case 'profit':
          valA = offerA - purchasePriceA;
          valB = offerB - purchasePriceB;
          break;
        case 'expires':
          valA = a.offers[0].until;
          valB = b.offers[0].until;
          break;
        default:
          valA = offerA - purchasePriceA;
          valB = offerB - purchasePriceB;
      }

      if (typeof valA === 'string') {
        return sortConfig.direction === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      return sortConfig.direction === 'asc' ? valA - valB : valB - valA;
    });

    return filtered;
  }, [squad, searchQuery, sortConfig]);

  const handleNext = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 320, behavior: 'smooth' });
    }
  };

  const handlePrev = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -320, behavior: 'smooth' });
    }
  };

  if (squad.filter((p) => p.offers && p.offers.length > 0).length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 bg-white/5 rounded-3xl border border-dashed border-white/10 backdrop-blur-sm">
        <div className="p-4 rounded-2xl bg-zinc-800/50 text-zinc-500 mb-4">
          <HandCoins size={32} strokeWidth={1.5} />
        </div>
        <h4 className="text-lg font-black text-white uppercase tracking-tight mb-1">
          Sin ofertas activas
        </h4>
        <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest text-center max-w-xs">
          Actualmente no tienes pujas de otros managers por tus jugadores.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filters Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2 md:px-0">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type="text"
            placeholder="Buscar jugador..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-black/20 border border-white/5 hover:border-white/10 rounded-full py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all"
          />
        </div>

        <div className="flex items-center gap-4 self-start sm:self-center">
          <div className="text-xs font-bold text-white/40 uppercase tracking-widest hidden sm:block">
            {playersWithOffers.length} {playersWithOffers.length === 1 ? 'Oferta' : 'Ofertas'}
          </div>

          {/* View Toggle */}
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/5">
            <button
              onClick={() => setViewMode('carousel')}
              className={`cursor-pointer p-2 rounded-lg transition-all ${viewMode === 'carousel' ? 'bg-zinc-800 text-white shadow-md' : 'text-white/40 hover:text-white/70'}`}
              title="Vista de Tarjetas"
            >
              <LayoutGrid size={16} />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`cursor-pointer p-2 rounded-lg transition-all ${viewMode === 'table' ? 'bg-zinc-800 text-white shadow-md' : 'text-white/40 hover:text-white/70'}`}
              title="Vista de Tabla"
            >
              <List size={16} />
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {viewMode === 'carousel' ? (
          <motion.div
            key="carousel-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative group/carousel"
          >
            {/* Navigation Buttons (Visible when > 1 offer) */}
            {playersWithOffers.length > 1 && (
              <>
                <button
                  onClick={handlePrev}
                  className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-zinc-800 border border-white/10 text-white shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-zinc-700 hover:scale-110 active:scale-95 disabled:opacity-0 hidden md:block"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 p-2 md:p-3 rounded-full bg-zinc-800 border border-white/10 text-white shadow-xl opacity-0 group-hover/carousel:opacity-100 transition-all hover:bg-zinc-700 hover:scale-110 active:scale-95 disabled:opacity-0 hidden md:block"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}

            <div
              ref={scrollRef}
              className="flex flex-col md:flex-row gap-4 w-full max-w-full overflow-x-auto pb-4 md:pb-2 md:min-h-[380px] items-stretch snap-x snap-mandatory px-2 md:px-0 scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
            >
              {playersWithOffers.map((player) => {
                const isExpanded = expandedId === player.id;
                const playerImage =
                  player.img ||
                  `https://biwenger.as.com/resources/images/players/full/${player.id}.png`;
                const offer = player.offers[0];
                const profit = offer.amount - (player.owner?.price || 0);
                const isPositive = profit >= 0;

                return (
                  <motion.div
                    layout
                    key={player.id}
                    onClick={() => setExpandedId(isExpanded ? null : player.id)}
                    className={`cursor-pointer overflow-hidden rounded-3xl relative group border shrink-0 transition-all duration-300 flex snap-center ${
                      isExpanded
                        ? `w-full md:w-[360px] xl:w-[380px] opacity-100 border-white/5 bg-zinc-900 shadow-2xl`
                        : `w-full md:w-[80px] h-[80px] md:h-auto opacity-80 hover:opacity-100 border-white/5 bg-white/5 hover:bg-white/10`
                    }`}
                    transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                  >
                    <div
                      className={`w-full relative pointer-events-${isExpanded ? 'auto' : 'none'} flex flex-col md:flex-row`}
                    >
                      <AnimatePresence mode="popLayout">
                        {isExpanded ? (
                          <motion.div
                            key="full"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full md:min-w-[360px] xl:min-w-[380px]"
                          >
                            <OfferCard
                              player={player}
                              onAccept={onAccept}
                              onReject={onReject}
                              loading={loading}
                            />
                          </motion.div>
                        ) : (
                          <motion.div
                            key="compact"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="w-full h-[80px] md:h-full md:w-full flex md:flex-col items-center justify-center p-4 gap-3 transition-colors absolute inset-0"
                          >
                            <div className="relative w-10 h-10 md:w-12 md:h-12 rounded-full overflow-hidden shrink-0 border border-white/10 bg-zinc-800">
                              <div className="relative w-full h-full pt-1.5 scale-[1.7] origin-top">
                                <Image
                                  src={playerImage}
                                  alt={player.name}
                                  fill
                                  className="object-cover object-top"
                                />
                              </div>
                            </div>

                            {/* Desktop vertical text */}
                            <div className="hidden md:flex [writing-mode:vertical-rl] rotate-180 text-white/70 group-hover:text-white font-black tracking-[0.2em] uppercase text-xs items-center h-full min-h-0 overflow-hidden whitespace-nowrap">
                              {player.name}
                            </div>

                            {/* Mobile horizontal text */}
                            <div className="md:hidden text-white/70 group-hover:text-white font-black tracking-widest uppercase text-xs truncate flex-1">
                              {player.name}
                            </div>

                            {/* Small Indicator */}
                            <div
                              className={`w-2 h-2 rounded-full shrink-0 ${isPositive ? 'bg-emerald-500' : 'bg-rose-500'}`}
                            />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="w-full"
          >
            <OffersTable
              players={playersWithOffers}
              onAccept={onAccept}
              onReject={onReject}
              loading={loading}
              sortConfig={sortConfig}
              onSort={setSortConfig}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OffersTable({ players, onAccept, onReject, loading, sortConfig, onSort }) {
  return (
    <div className="w-full hide-scrollbar rounded-3xl border border-white/5 bg-zinc-900/50 backdrop-blur-md shadow-2xl overflow-hidden">
      <Table tableClassName="min-w-[950px]">
        <TableHeader>
          <TableRow hovering={false}>
            <SortableHeader
              label="Jugador"
              sortKey="name"
              currentSort={sortConfig}
              onSort={onSort}
              align="center"
              className="p-3"
            />
            <SortableHeader
              label="Inversión"
              sortKey="investment"
              currentSort={sortConfig}
              onSort={onSort}
              align="center"
              className="p-3"
            />
            <SortableHeader
              label="Precio Actual"
              sortKey="price"
              currentSort={sortConfig}
              onSort={onSort}
              align="center"
              className="p-3"
            />
            <SortableHeader
              label="Oferta"
              sortKey="offer"
              currentSort={sortConfig}
              onSort={onSort}
              align="center"
              className="p-3"
            />
            <SortableHeader
              label="Beneficio Actual"
              sortKey="profitActual"
              currentSort={sortConfig}
              onSort={onSort}
              align="center"
              className="p-3"
            />
            <SortableHeader
              label="Beneficio Total"
              sortKey="profit"
              currentSort={sortConfig}
              onSort={onSort}
              align="center"
              className="p-3"
            />
            <SortableHeader
              label="Expira"
              sortKey="expires"
              currentSort={sortConfig}
              onSort={onSort}
              align="center"
              className="p-3"
            />
            <TableHeaderCell align="center" className="p-3">
              Acciones
            </TableHeaderCell>
          </TableRow>
        </TableHeader>
        <tbody className="divide-y divide-white/5">
          {players.map((player) => {
            const offer = player.offers[0];
            const purchasePrice = player.owner?.price || 0;
            const currentPrice = player.price || 0;
            const profit = offer.amount - purchasePrice;
            const profitActual = offer.amount - currentPrice;
            const playerImage =
              player.img ||
              `https://biwenger.as.com/resources/images/players/full/${player.id}.png`;
            const hoursLeft = getHoursLeft(offer.until);

            return (
              <TableRow key={player.id} className="group">
                <TableCell align="left" className="p-3 pl-6">
                  <div className="inline-flex items-center">
                    <TableIdentity
                      name={player.name}
                      image={playerImage}
                      color="text-white"
                      size="md"
                      link={`/player/${player.id}`}
                      imageClassName="scale-[1.7] origin-top pt-1"
                    />
                  </div>
                </TableCell>
                <TableCell align="center" className="p-3">
                  <span className="text-sm font-bold text-zinc-400">
                    {formatCurrency(purchasePrice)}
                  </span>
                </TableCell>
                <TableCell align="center" className="p-3">
                  <span className="text-sm font-bold text-blue-400">
                    {formatCurrency(currentPrice)}
                  </span>
                </TableCell>
                <TableCell align="center" className="p-3">
                  <span className="text-sm font-black text-emerald-500">
                    {formatCurrency(offer.amount)}
                  </span>
                </TableCell>
                <TableCell align="center" className="p-3">
                  <div
                    className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black ${profitActual >= 0 ? 'bg-emerald-800/20 text-emerald-500' : 'bg-rose-500/10 text-rose-400'}`}
                  >
                    {profitActual >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {profitActual >= 0 ? '+' : ''}
                    {formatCurrency(profitActual)}
                  </div>
                </TableCell>
                <TableCell align="center" className="p-3">
                  <div
                    className={`inline-flex items-center justify-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-black ${profit >= 0 ? 'bg-emerald-800/20 text-emerald-500' : 'bg-rose-500/10 text-rose-400'}`}
                  >
                    {profit >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                    {profit >= 0 ? '+' : ''}
                    {formatCurrency(profit)}
                  </div>
                </TableCell>
                <TableCell align="center" className="p-3">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-zinc-400">
                    <Clock size={12} className={hoursLeft < 4 ? 'text-rose-500' : ''} />
                    <span className={hoursLeft < 4 ? 'text-rose-500' : ''}>{hoursLeft}h</span>
                  </div>
                </TableCell>
                <TableCell align="center" className="p-3">
                  <div className="flex items-center justify-center gap-2">
                    <button
                      onClick={() => onReject(player, offer)}
                      disabled={loading}
                      className="p-2 rounded-xl bg-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-700 transition-all border border-white/5 cursor-pointer disabled:cursor-not-allowed"
                      title="Rechazar Oferta"
                    >
                      <X size={16} />
                    </button>
                    <button
                      onClick={() => onAccept(player, offer)}
                      disabled={loading}
                      className="p-2 rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed"
                      title="Aceptar Oferta"
                    >
                      <Check size={16} />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </tbody>
      </Table>
    </div>
  );
}

function OfferCard({ player, onAccept, onReject, loading }) {
  const [imgError, setImgError] = useState(false);

  // Financial Logic
  const offer = player.offers[0];
  const offerAmount = offer.amount;
  const purchasePrice = player.owner?.price || 0;
  const marketValue = player.price;

  // Calculated Stats
  const totalProfit = offerAmount - purchasePrice;
  const marketDiff = offerAmount - marketValue;
  const profitPercent = purchasePrice > 0 ? ((totalProfit / purchasePrice) * 100).toFixed(1) : 0;
  const marketDiffPercent = ((marketDiff / marketValue) * 100).toFixed(1);

  // Time Logic
  const { hoursLeft, timeLeft } = useMemo(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Math.floor(Date.now() / 1000);
    const tl = offer.until - now;
    return {
      hoursLeft: Math.max(0, Math.floor(tl / 3600)),
      timeLeft: tl,
    };
  }, [offer.until]);

  // Image Source Logic
  const playerImage =
    !imgError && player.img
      ? player.img
      : `https://biwenger.as.com/resources/images/players/full/${player.id}.png`;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="group relative bg-zinc-900 border border-white/5 rounded-3xl overflow-hidden hover:border-white/10 transition-all duration-300 shadow-2xl shrink-0 snap-center w-[85vw] sm:w-[340px] xl:w-[380px]"
    >
      {/* Expiration Banner */}
      <div className="absolute top-0 right-0 left-0 h-1 bg-zinc-800">
        <motion.div
          initial={{ width: '100%' }}
          animate={{ width: `${Math.min(100, (timeLeft / (24 * 3600)) * 100)}%` }}
          className={`h-full ${hoursLeft < 4 ? 'bg-rose-500' : 'bg-primary'}`}
        />
      </div>

      <div className="p-5 space-y-5">
        {/* Player Info Row */}
        <div className="flex items-center gap-4">
          <div className="relative w-14 h-14 rounded-xl bg-zinc-800 overflow-hidden border border-white/5 shadow-inner">
            <div className="relative w-full h-full pt-2 scale-[1.7] origin-top">
              <Image
                src={playerImage}
                alt={player.name}
                fill
                className="object-cover object-top"
                onError={() => setImgError(true)}
              />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-black text-white truncate tracking-tight">{player.name}</h3>
            <div className="flex items-center gap-2 text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">
              <Clock size={12} className={hoursLeft < 4 ? 'text-rose-500' : ''} />
              <span className={hoursLeft < 4 ? 'text-rose-500' : ''}>
                Expira en {hoursLeft}h {Math.floor((timeLeft % 3600) / 60)}m
              </span>
            </div>
          </div>
          <div
            className={`p-2.5 rounded-xl ${totalProfit >= 0 ? 'bg-emerald-800/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}
          >
            {totalProfit >= 0 ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
          </div>
        </div>

        {/* Financial Grid */}
        <div className="grid grid-cols-3 gap-2 py-3 border-y border-white/5">
          <div className="space-y-1 text-center">
            <span className="text-[9px] text-white/60 uppercase font-black tracking-widest">
              Inversión
            </span>
            <div className="text-xs font-bold text-zinc-300">{formatCurrency(purchasePrice)}</div>
          </div>
          <div className="space-y-1 border-x border-white/5 text-center">
            <span className="text-[9px] text-white/60 uppercase font-black tracking-widest">
              Valor
            </span>
            <div className="text-xs font-bold text-zinc-300">{formatCurrency(marketValue)}</div>
          </div>
          <div className="space-y-1 text-center">
            <span className="text-[9px] text-white/60 uppercase font-black tracking-widest">
              Oferta
            </span>
            <div
              className={`text-xs font-black ${marketDiff >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}
            >
              {formatCurrency(offerAmount)}
            </div>
          </div>
        </div>

        {/* Performance Indicators */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 min-w-0">
            <span className="text-xs text-white font-black uppercase tracking-wider block mb-2 truncate">
              Beneficio Total
            </span>
            <div
              className={`text-sm xl:text-base font-black flex items-center gap-1.5 whitespace-nowrap ${totalProfit >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}
            >
              <span className="truncate">
                {totalProfit >= 0 ? '+' : ''}
                {formatCurrency(totalProfit)}
              </span>
              <span className="text-[10px] xl:text-xs opacity-50 font-medium shrink-0">
                ({profitPercent}%)
              </span>
            </div>
          </div>
          <div className="p-3 rounded-2xl bg-white/5 border border-white/10 min-w-0">
            <span className="text-xs text-white font-black uppercase tracking-wider block mb-2 truncate">
              Margen Mercado
            </span>
            <div
              className={`text-sm xl:text-base font-black flex items-center gap-1.5 whitespace-nowrap ${marketDiff >= 0 ? 'text-emerald-500' : 'text-rose-400'}`}
            >
              <span className="truncate">
                {marketDiff >= 0 ? '+' : ''}
                {formatCurrency(marketDiff)}
              </span>
              <span className="text-[10px] xl:text-xs opacity-50 font-medium shrink-0">
                ({marketDiffPercent}%)
              </span>
            </div>
          </div>
        </div>

        {/* Action Row */}
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => onReject(player, offer)}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-white transition-all text-xs font-bold uppercase tracking-wider cursor-pointer border border-white/5"
          >
            <X size={14} />
            Rechazar
          </button>
          <button
            onClick={() => onAccept(player, offer)}
            disabled={loading}
            className="flex-[2] flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-800 text-white hover:bg-emerald-700 hover:shadow-emerald-800/20 hover:scale-[1.02] active:scale-95 transition-all text-xs font-black uppercase tracking-wider shadow-lg cursor-pointer"
          >
            <Check size={14} />
            Aceptar Oferta
          </button>
        </div>
      </div>
    </motion.div>
  );
}
