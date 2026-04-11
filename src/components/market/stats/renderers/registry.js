'use client';

import React from 'react';
import Link from 'next/link';
import { formatEuro, formatProfit } from '@/lib/utils/currency';
import { Timer, Hourglass, ArrowRight } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';

/**
 * Registry of Market Metrics
 * Each entry defines how to identify a metric and how to render its values.
 */

const formatTime = (hours) => {
  if (hours < 1) return `${Math.round(hours * 60)}m`;
  if (hours < 24) return `${hours.toFixed(1)}h`;
  return `${(hours / 24).toFixed(1)}d`;
};

export const METRIC_REGISTRY = {
  // --- PLAYER METRICS ---
  PLAYER: [
    {
      id: 'transfers_owners',
      match: (item) =>
        item.transfer_count !== undefined || item.distinct_owners_count !== undefined,
      label: (item) => (item.transfer_count !== undefined ? 'Total Fichajes' : 'Propietarios'),
      value: (item) =>
        item.transfer_count !== undefined ? item.transfer_count : item.distinct_owners_count,
      sub: (item) => {
        if (item.avg_price) return `Desembolso Medio: ${formatEuro(item.avg_price)}€`;
        if (item.team_name && item.team_logo) {
          return (
            <div className="flex items-center gap-1.5 overflow-hidden">
              <img
                src={item.team_logo}
                alt={item.team_name}
                className="w-3.5 h-3.5 object-contain shrink-0"
              />
              <span className="truncate">{item.team_name}</span>
            </div>
          );
        }
        return '';
      },
    },
    {
      id: 'inflation',
      match: (item) => item.inflation !== undefined,
      label: 'Sobreprecio',
      value: (item) => `+${formatEuro(item.inflation)}€`,
      sub: (item) =>
        `P: ${formatEuro(item.purchase_price)}€ · M: ${formatEuro(item.market_price)}€`,
      summary: {
        key: 'inflation',
        label: 'Sobreprecio Total',
        type: 'currency',
      },
    },
    {
      id: 'absences',
      match: (item) => item.missed_rounds !== undefined,
      label: 'Ausencias',
      value: (item) => `${item.missed_rounds}`,
      sub: (item) => {
        const rate = item.available_rounds
          ? Math.round((item.played_rounds / item.available_rounds) * 100)
          : 0;
        return `Asistencia: ${rate}% (${item.played_rounds}/${item.available_rounds})`;
      },
      summary: {
        key: 'missed_rounds',
        label: 'Ausencias Totales',
        type: 'number',
      },
    },
    {
      id: 'revaluation',
      match: (item) =>
        item.revaluation !== undefined ||
        item.devaluation !== undefined ||
        item.percentage_gain !== undefined,
      label: (item) =>
        item.percentage_gain !== undefined
          ? 'Rentabilidad'
          : (item.revaluation !== undefined ? item.revaluation : item.devaluation) >= 0
            ? 'Revalorización'
            : 'Depreciación',
      value: (item) => {
        if (item.percentage_gain !== undefined) return `+${item.percentage_gain.toFixed(0)}%`;
        const change = item.revaluation !== undefined ? item.revaluation : item.devaluation;
        return `${formatEuro(Math.abs(change))}€`;
      },
      sub: (item) =>
        `C: ${formatEuro(item.purchase_price || 0)}€ · A: ${formatEuro(item.current_price || item.price || 0)}€`,
      summary: {
        key: (item) => (item.revaluation !== undefined ? item.revaluation : item.devaluation),
        label: (item) =>
          (item.revaluation !== undefined ? item.revaluation : item.devaluation) >= 0
            ? 'Revalorización Total'
            : 'Depreciación Total',
        type: 'currency',
      },
    },
    {
      id: 'missed_profit',
      match: (item) => item.missed_profit !== undefined,
      label: 'Beneficio Perdido',
      value: (item) => `${formatEuro(item.missed_profit)}€`,
      sub: (item) =>
        `V: ${formatEuro(item.sale_price || 0)}€ · A: ${formatEuro(item.current_price || 0)}€`,
      summary: {
        key: 'missed_profit',
        label: 'Beneficio Perdido Total',
        type: 'currency',
      },
    },
    {
      id: 'points_million',
      match: (item) => item.points_per_million !== undefined,
      label: 'Puntos / Millón',
      value: (item) => item.points_per_million.toFixed(2),
      sub: (item) => `${item.total_points} puntos totales`,
    },
  ],

  // --- USER / MANAGER METRICS ---
  USER: [
    {
      id: 'investment',
      match: (item) => item.total_spent !== undefined && item.purchases_count !== undefined,
      label: 'Inversión Total',
      value: (item) => `${formatEuro(item.total_spent)}€`,
      sub: (item) => `${item.purchases_count || 0} fichajes realizados`,
      summary: {
        key: 'total_spent',
        label: 'Inversión Total Liga',
        type: 'currency',
      },
    },
    {
      id: 'steals',
      match: (item) => item.stolen_count !== undefined,
      label: 'Jugadores Robados',
      value: (item) => item.stolen_count,
      sub: (item) =>
        item.total_spent ? `${formatEuro(item.total_spent)}€ invertidos` : 'Al acecho',
    },
    {
      id: 'failed_bids',
      match: (item) => item.failed_bids_count !== undefined,
      label: 'Jugadores Perdidos',
      value: (item) => item.failed_bids_count,
      sub: (item) => 'Pujas realizadas sin éxito',
      summary: {
        key: 'failed_bids_count',
        label: 'Total Pujas Fallidas',
        type: 'number',
      },
    },
    {
      id: 'overpay',
      match: (item) => item.total_overpay !== undefined,
      label: 'Sobrepago Total',
      value: (item) => `${formatEuro(item.total_overpay)}€`,
      sub: (item) => `${item.contested_wins} subastas ganadas con sobrepago`,
      summary: {
        key: 'total_overpay',
        label: 'Sobrepago Total',
        type: 'currency',
      },
    },
    {
      id: 'profit',
      match: (item) => item.net_profit !== undefined || item.total_profit !== undefined,
      label: 'Beneficio Neto',
      value: (item) => formatProfit(item.net_profit || item.total_profit || 0),
      sub: (item) =>
        item.sales_count !== undefined
          ? `${item.sales_count} operaciones completadas`
          : `${item.trade_count || 0} operaciones`,
      summary: {
        key: (item) => item.net_profit || item.total_profit || 0,
        label: 'Beneficio Neto Total Liga',
        type: 'currency',
      },
    },
    {
      id: 'trades',
      match: (item) => item.trade_count !== undefined,
      label: 'Operaciones',
      value: (item) => item.trade_count,
      sub: (item) => 'Volumen total de actividad',
      summary: {
        key: 'trade_count',
        label: 'Operaciones Totales',
        type: 'number',
      },
    },
  ],

  // --- TRANSACTION / FLOW METRICS ---
  TRANSACTION: [
    {
      id: 'robbery',
      match: (item) => item.price_diff !== undefined,
      label: 'Margen de Victoria',
      value: (item) => `+${formatEuro(item.price_diff)}€`,
      sub: null,
      info: (item) => (
        <div className="flex items-center gap-1.5 flex-wrap mt-1">
          <Link
            href={`/user/${item.winner_id}`}
            onClick={(e) => e.stopPropagation()}
            className={`text-[10px] font-black uppercase tracking-tight hover:scale-105 transition-transform duration-200 ${getColorForUser(item.winner_id, item.winner, item.winner_color).text}`}
          >
            {item.winner}
          </Link>
          <span className="text-[9px] text-zinc-400 font-bold uppercase shrink-0">le robó a</span>
          <Link
            href={`/user/${item.second_bidder_id}`}
            onClick={(e) => e.stopPropagation()}
            className={`text-[10px] font-black uppercase tracking-tight hover:scale-105 transition-transform duration-200 ${getColorForUser(item.second_bidder_id, item.second_bidder_name, item.second_bidder_color).text}`}
          >
            {item.second_bidder_name || 'otro manager'}
          </Link>
        </div>
      ),
      summary: {
        key: 'price_diff',
        label: 'Margen Total',
        type: 'currency',
      },
    },
    {
      id: 'auction',
      match: (item) => item.bid_count !== undefined,
      label: 'Pujas',
      value: (item) => item.bid_count,
      sub: (item) => `Precio Traspaso: ${formatEuro(item.precio)}€`,
      summary: {
        key: 'bid_count',
        label: 'Pujas Totales',
        type: 'number',
      },
    },
    {
      id: 'transfer',
      match: (item) => item.vendedor && item.comprador,
      label: 'Precio Traspaso',
      value: (item) => `${formatEuro(item.precio || item.price || 0)}€`,
      sub: null, // Removed team as requested
      info: (item) => (
        <div className="flex items-center gap-1.5 mt-1.5 overflow-hidden">
          <Link
            href={
              item.vendedor === 'Mercado' || item.vendedor === 'Biwenger'
                ? '#'
                : `/user/${item.vendedor_id || item.seller_id}`
            }
            onClick={(e) => e.stopPropagation()}
            className={`text-[10px] font-black uppercase tracking-widest truncate transition-transform duration-200 hover:scale-105 origin-left ${
              item.vendedor === 'Mercado' || item.vendedor === 'Biwenger'
                ? 'text-zinc-500 cursor-default pointer-events-none'
                : getColorForUser(
                    item.vendedor_id || item.seller_id,
                    item.vendedor,
                    item.vendedor_color_index || item.seller_color
                  ).text
            }`}
          >
            {item.vendedor}
          </Link>
          <ArrowRight size={10} className="text-zinc-700 shrink-0" />
          <Link
            href={
              item.comprador === 'Mercado' || item.comprador === 'Biwenger'
                ? '#'
                : `/user/${item.comprador_id || item.buyer_id}`
            }
            onClick={(e) => e.stopPropagation()}
            className={`text-[10px] font-black uppercase tracking-widest truncate transition-transform duration-200 hover:scale-105 origin-left ${
              item.comprador === 'Mercado' || item.comprador === 'Biwenger'
                ? 'text-zinc-500 cursor-default pointer-events-none'
                : getColorForUser(
                    item.comprador_id || item.buyer_id,
                    item.comprador,
                    item.comprador_color_index || item.buyer_color
                  ).text
            }`}
          >
            {item.comprador}
          </Link>
        </div>
      ),
      summary: {
        key: (item) => item.precio || item.price || 0,
        label: 'Volumen Total de Traspasos',
        type: 'currency',
      },
    },
  ],

  // --- TEMPORAL / FLIP METRICS ---
  TEMPORAL: [
    {
      id: 'quickflip',
      match: (item) => item.hours_held !== undefined,
      label: 'Beneficio Quickflip',
      value: (item) => `+${formatEuro(item.profit || 0)}€`,
      sub: (item) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-orange-400 font-bold">
            <Timer className="w-3.5 h-3.5" />
            {formatTime(item.hours_held)} de posesión
          </div>
          <div className="flex items-center gap-2 opacity-70 text-[10px]">
            C: {formatEuro(item.purchase_price || 0)}€ · V: {formatEuro(item.sale_price || 0)}€
          </div>
        </div>
      ),
      summary: {
        key: 'profit',
        label: 'Beneficio Total Realizado',
        type: 'currency',
      },
    },
    {
      id: 'revaluation_flip',
      match: (item) => item.days_held !== undefined,
      label: 'Beneficio Realizado',
      value: (item) => `+${formatEuro(item.profit || 0)}€`,
      sub: (item) => (
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-teal-400 font-bold">
            <Hourglass className="w-3.5 h-3.5" />
            {Math.floor(item.days_held)} días en plantilla
          </div>
          <div className="flex items-center gap-2 opacity-70 text-[10px]">
            C: {formatEuro(item.purchase_price || 0)}€ · V: {formatEuro(item.sale_price || 0)}€
          </div>
        </div>
      ),
      summary: {
        key: 'profit',
        label: 'Beneficio Total Realizado',
        type: 'currency',
      },
    },
    {
      id: 'revaluation_open',
      match: (item) =>
        item.revaluation !== undefined ||
        item.devaluation !== undefined ||
        item.percentage_gain !== undefined,
      label: (item) =>
        item.percentage_gain !== undefined
          ? 'Rentabilidad'
          : (item.revaluation !== undefined ? item.revaluation : item.devaluation) >= 0
            ? 'Revalorización'
            : 'Depreciación',
      value: (item) => {
        if (item.percentage_gain !== undefined) return `+${item.percentage_gain.toFixed(0)}%`;
        const change = item.revaluation !== undefined ? item.revaluation : item.devaluation;
        return `${formatEuro(Math.abs(change))}€`;
      },
      sub: (item) =>
        `C: ${formatEuro(item.purchase_price || 0)}€ · A: ${formatEuro(item.current_price || item.price || 0)}€`,
      summary: {
        key: (item) => (item.revaluation !== undefined ? item.revaluation : item.devaluation),
        label: (item) =>
          (item.revaluation !== undefined ? item.revaluation : item.devaluation) >= 0
            ? 'Revalorización Total'
            : 'Depreciación Total',
        type: 'currency',
      },
    },
    {
      id: 'missed_profit_item',
      match: (item) => item.missed_profit !== undefined,
      label: 'Beneficio Perdido',
      value: (item) => `${formatEuro(item.missed_profit)}€`,
      sub: (item) =>
        `V: ${formatEuro(item.sale_price || 0)}€ · A: ${formatEuro(item.current_price || 0)}€`,
      summary: {
        key: 'missed_profit',
        label: 'Beneficio Perdido Total',
        type: 'currency',
      },
    },
    {
      id: 'generic_flip',
      match: (item) => item.purchase_price !== undefined && item.sale_price !== undefined,
      label: (item) => {
        const p = item.profit !== undefined ? item.profit : item.sale_price - item.purchase_price;
        return p >= 0 ? 'Beneficio' : 'Pérdida';
      },
      value: (item) => {
        const p = item.profit !== undefined ? item.profit : item.sale_price - item.purchase_price;
        return `${formatEuro(Math.abs(p))}€`;
      },
      sub: (item) => `C: ${formatEuro(item.purchase_price)}€ · V: ${formatEuro(item.sale_price)}€`,
      summary: {
        key: (item) =>
          item.profit !== undefined ? item.profit : item.sale_price - item.purchase_price,
        label: (item) => {
          const p = item.profit !== undefined ? item.profit : item.sale_price - item.purchase_price;
          return p >= 0 ? 'Beneficio Total' : 'Pérdida Total';
        },
        type: 'currency',
      },
    },
  ],
};

/**
 * Helper to get the correct config for an item based on a category
 */
export function getMetricConfig(item, category) {
  const metrics = METRIC_REGISTRY[category] || [];
  return metrics.find((m) => m.match(item)) || null;
}
