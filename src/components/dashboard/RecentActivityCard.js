'use client';

import { useUser } from '@/contexts/UserContext';
import { Activity, TrendingUp, TrendingDown, Trophy, Euro, ArrowRight, Bell } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';
import { useApiData } from '@/lib/hooks/useApiData';

export default function RecentActivityCard() {
  const { currentUser } = useUser();
  const [activeTab, setActiveTab] = useState('transfers');
  const userId = currentUser?.id || '';
  
  const { data = {}, loading } = useApiData(
    `/api/recent-activity?userId=${userId}`,
    { dependencies: [userId] }
  );

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700/50 rounded w-1/3 mb-4"></div>
        <div className="space-y-3">
          <div className="h-4 bg-slate-700/50 rounded"></div>
          <div className="h-4 bg-slate-700/50 rounded"></div>
          <div className="h-4 bg-slate-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  const { recentTransfers, priceChanges, recentRecords, personalizedAlerts } = data || {};

  const tabs = [
    { id: 'transfers', label: 'Fichajes', icon: Euro, count: recentTransfers?.length || 0 },
    { id: 'prices', label: 'Precios', icon: Activity, count: priceChanges?.length || 0 },
    { id: 'records', label: 'Récords', icon: Trophy, count: recentRecords?.length || 0 },
    { id: 'alerts', label: 'Alertas', icon: Bell, count: personalizedAlerts?.length || 0 }
  ];

  return (
    <div className="col-span-full bg-gradient-to-br from-slate-900 to-slate-800 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-600/50 transition-all">
      {/* Background decoration */}
      <div className="absolute -bottom-10 -right-10 opacity-5 group-hover:opacity-10 transition-opacity">
        <Activity className="w-40 h-40 text-blue-500" />
      </div>

      <div className="relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-500" />
            Actividad Reciente
          </h2>
          <Link href="/market" className="text-sm text-blue-400 hover:text-blue-300 transition-colors">
            Ver mercado
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                    : 'bg-slate-800/40 text-slate-400 border border-slate-700/30 hover:bg-slate-800/60 hover:text-slate-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="bg-slate-700 text-slate-300 text-xs px-1.5 py-0.5 rounded-full">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="min-h-[200px]">
          {/* Transfers Tab */}
          {activeTab === 'transfers' && (
            <div className="space-y-0">
              {recentTransfers && recentTransfers.length > 0 ? (
                recentTransfers.map((transfer) => (
                  <div 
                    key={transfer.id} 
                    className="flex items-center justify-between py-3 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/20 px-2 rounded transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-sm font-bold text-white">
                        {transfer.player_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <div className="font-medium text-white text-sm">{transfer.player_name}</div>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <span className="text-red-400">{transfer.vendedor || 'Mercado'}</span>
                          <ArrowRight className="w-3 h-3" />
                          <span className="text-green-400">{transfer.comprador}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-white text-sm">
                        {(transfer.precio / 1000000).toFixed(2)}M€
                      </div>
                      <div className="text-[10px] text-slate-500">
                        {new Date(transfer.timestamp * 1000).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-8">No hay fichajes recientes</div>
              )}
            </div>
          )}

          {/* Price Changes Tab */}
          {activeTab === 'prices' && (
            <div className="space-y-2">
              {priceChanges && priceChanges.length > 0 ? (
                priceChanges.map((player) => (
                  <div 
                    key={player.player_id}
                    className="flex items-center justify-between p-3 bg-slate-800/40 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-all"
                  >
                    <div className="flex-1">
                      <div className="font-medium text-white text-sm">{player.name}</div>
                      <div className="text-xs text-slate-400">{player.team} · {player.position}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-sm text-white">
                        {(player.price / 1000000).toFixed(2)}M€
                      </div>
                      <div className={`text-xs font-bold flex items-center gap-1 justify-end ${
                        player.price_increment > 0 ? 'text-green-400' : 'text-red-400'
                      }`}>
                        {player.price_increment > 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {player.price_increment > 0 ? '+' : ''}{(player.price_increment / 1000000).toFixed(2)}M
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-8">No hay cambios significativos</div>
              )}
            </div>
          )}

          {/* Records Tab */}
          {activeTab === 'records' && (
            <div className="space-y-3">
              {recentRecords && recentRecords.length > 0 ? (
                recentRecords.map((record, idx) => (
                  <div 
                    key={idx}
                    className="p-4 bg-gradient-to-r from-slate-800/60 to-slate-800/20 rounded-lg border border-slate-700/30 hover:border-yellow-500/30 transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <Trophy className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="text-xs font-semibold text-yellow-400 uppercase tracking-wide mb-1">
                          {record.label}
                        </div>
                        <div className="text-sm text-white font-medium">
                          {record.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-8">No hay récords recientes</div>
              )}
            </div>
          )}

          {/* Alerts Tab */}
          {activeTab === 'alerts' && (
            <div className="space-y-2">
              {personalizedAlerts && personalizedAlerts.length > 0 ? (
                personalizedAlerts.map((alert, idx) => (
                  <div 
                    key={idx}
                    className={`p-3 rounded-lg border flex items-start gap-3 transition-all ${
                      alert.severity === 'success' 
                        ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50' 
                        : alert.severity === 'warning'
                        ? 'bg-yellow-500/10 border-yellow-500/30 hover:border-yellow-500/50'
                        : 'bg-blue-500/10 border-blue-500/30 hover:border-blue-500/50'
                    }`}
                  >
                    <span className="text-2xl flex-shrink-0">{alert.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-white font-medium">
                        {alert.message}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-slate-500 py-8">
                  {currentUser ? 'No hay alertas para ti' : 'Selecciona un usuario para ver alertas'}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
