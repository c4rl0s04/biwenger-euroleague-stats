'use client';

import { Flame, Snowflake, TrendingUp, TrendingDown } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function HotColdStreaksCard() {
  const [streaks, setStreaks] = useState({ hot: [], cold: [] });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('hot');

  useEffect(() => {
    fetch('/api/player-streaks')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setStreaks(result.data || { hot: [], cold: [] });
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching streaks:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700/50 rounded w-1/2 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-slate-700/50 rounded"></div>
          <div className="h-16 bg-slate-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'hot', label: 'En Racha', icon: Flame, count: streaks.hot?.length || 0, color: 'orange' },
    { id: 'cold', label: 'En Bache', icon: Snowflake, count: streaks.cold?.length || 0, color: 'cyan' }
  ];

  const activeData = activeTab === 'hot' ? streaks.hot : streaks.cold;

  return (
    <div className={`bg-gradient-to-br ${activeTab === 'hot' ? 'from-orange-900/20 border-orange-700/30 hover:border-orange-600/50' : 'from-cyan-900/20 border-cyan-700/30 hover:border-cyan-600/50'} to-slate-900 backdrop-blur-md border rounded-2xl p-6 relative overflow-hidden group transition-all`}>
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity">
        {activeTab === 'hot' ? (
          <Flame className="w-32 h-32 text-orange-500" />
        ) : (
          <Snowflake className="w-32 h-32 text-cyan-500" />
        )}
      </div>

      <div className="relative">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          {activeTab === 'hot' ? <Flame className="w-5 h-5 text-orange-500" /> : <Snowflake className="w-5 h-5 text-cyan-500" />}
          Rachas de Forma
        </h2>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 ${
                  activeTab === tab.id
                    ? tab.color === 'orange'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    : 'bg-slate-800/40 text-slate-400 border border-slate-700/30 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
                {tab.count > 0 && (
                  <span className="bg-slate-700 text-slate-300 text-xs px-1.5 py-0.5 rounded-full ml-auto">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="space-y-2">
          {activeData && activeData.length > 0 ? (
            activeData.map((player) => (
              <div key={player.player_id} className="p-3 bg-slate-800/40 rounded-lg border border-slate-700/30 hover:border-slate-600/50 transition-all">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link href={`/player/${player.player_id}`} className="font-medium text-white text-sm hover:text-blue-400 transition-colors block">
                      {player.name}
                    </Link>
                    <div className="text-xs text-slate-400">{player.team} · {player.position}</div>
                    {player.owner_name && (
                      <div className="text-xs text-blue-400">👤 {player.owner_name}</div>
                    )}
                  </div>
                  <div className="text-right ml-3">
                    <div className={`flex items-center gap-1 text-sm font-bold ${
                      activeTab === 'hot' ? 'text-orange-400' : 'text-cyan-400'
                    }`}>
                      {activeTab === 'hot' ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {Math.abs(player.trend_pct)}%
                    </div>
                    <div className="text-xs text-slate-500">{player.recent_avg.toFixed(1)} pts/g</div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-slate-500 py-8">No hay datos suficientes</div>
          )}
        </div>
      </div>
    </div>
  );
}
