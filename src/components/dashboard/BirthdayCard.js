'use client';

import { Cake, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import { useApiData } from '@/lib/hooks/useApiData';

export default function BirthdayCard() {
  const { data: birthdays = [], loading } = useApiData('/api/dashboard/birthdays');

  return (
    <Card title="Cumpleaños Hoy" icon={Cake} color="pink" loading={loading}>
      {!loading && (
        <div className="relative flex-1 flex flex-col h-full">
          {birthdays && birthdays.length > 0 ? (
            <div className="space-y-3 flex-1">
              {birthdays.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center gap-3 p-3 bg-pink-500/10 rounded-lg border border-pink-500/20"
                >
                  <Sparkles className="w-5 h-5 text-pink-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/player/${player.id}`}
                      className="font-medium text-white hover:text-pink-400 transition-colors block"
                    >
                      {player.name}
                    </Link>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span>
                        {player.team} · {player.position}
                      </span>
                      {player.birth_date && (
                        <span className="text-pink-300 font-semibold px-1.5 py-0.5 bg-pink-500/10 rounded">
                          {new Date().getFullYear() - new Date(player.birth_date).getFullYear()}{' '}
                          años
                        </span>
                      )}
                    </div>
                    {player.owner_name && (
                      <div className="text-xs text-pink-400 mt-0.5">👤 {player.owner_name}</div>
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
      )}
    </Card>
  );
}
