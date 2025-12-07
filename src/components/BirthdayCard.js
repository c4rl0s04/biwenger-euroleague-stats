'use client';

import { Cake, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function BirthdayCard() {
  const [birthdays, setBirthdays] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/birthdays')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setBirthdays(result.data || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching birthdays:', err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="bg-slate-900/50 backdrop-blur-md border border-slate-800 rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700/50 rounded w-1/2 mb-4"></div>
        <div className="h-4 bg-slate-700/50 rounded"></div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-pink-900/30 to-slate-900 backdrop-blur-md border border-pink-700/30 rounded-2xl p-6 relative overflow-hidden group hover:border-pink-600/50 transition-all">
      {/* Background decoration */}
      <div className="absolute -top-6 -right-6 opacity-10 group-hover:opacity-20 transition-opacity">
        <Cake className="w-32 h-32 text-pink-500" />
      </div>

      <div className="relative">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Cake className="w-5 h-5 text-pink-500" />
          Cumpleaños Hoy
        </h2>

        {birthdays && birthdays.length > 0 ? (
          <div className="space-y-3">
            {birthdays.map((player) => (
              <div key={player.id} className="flex items-center gap-3 p-3 bg-pink-500/10 rounded-lg border border-pink-500/20">
                <Sparkles className="w-5 h-5 text-pink-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <Link href={`/player/${player.id}`} className="font-medium text-white hover:text-pink-400 transition-colors block">
                    {player.name}
                  </Link>
                  <div className="text-xs text-slate-400">{player.team} · {player.position}</div>
                  {player.owner_name && (
                    <div className="text-xs text-pink-400">👤 {player.owner_name}</div>
                  )}
                </div>
                <div className="text-2xl">🎂</div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-slate-400">
            <Cake className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No hay cumpleaños hoy</p>
          </div>
        )}
      </div>
    </div>
  );
}
