'use client';

import { Wine } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import StatsList from '@/components/ui/StatsList';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

export default function BottlerCard() {
  const { data = [], loading } = useApiData('/api/standings/bottlers');

  return (
    <Card
      title="The Bottlers (Casi ganan)"
      icon={Wine}
      color="pink"
      loading={loading}
      className="h-full flex flex-col"
    >
      {!loading &&
        (data.length > 0 ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
              <p className="text-xs text-slate-300 font-medium italic px-2">
                Suma puntos por <span className="text-pink-400 font-bold not-italic">2º</span> y{' '}
                <span className="text-pink-400 font-bold not-italic">3er</span> puesto. Resta por{' '}
                <span className="text-pink-400 font-bold not-italic">ganar</span>.
              </p>
            </div>

            <StatsList
              items={data}
              renderLeft={(user, index, colors) => (
                <div className="flex items-center gap-3 w-full">
                  <span className="text-sm font-bold w-4 text-slate-400 shrink-0">{index + 1}</span>

                  <div className="relative shrink-0">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-[10px] border-2 overflow-hidden"
                      style={{
                        backgroundColor: user.icon ? 'transparent' : colors.stroke,
                        borderColor: colors.fill,
                      }}
                    >
                      {user.icon ? (
                        <img
                          src={user.icon}
                          alt={user.name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.parentElement.innerHTML = user.name
                              .substring(0, 2)
                              .toUpperCase();
                          }}
                        />
                      ) : (
                        user.name.substring(0, 2).toUpperCase()
                      )}
                    </div>
                    {index === 0 && (
                      <div className="absolute -top-1.5 -right-1.5 bg-pink-500 text-white p-0.5 rounded-full shadow-lg z-10">
                        <Wine size={10} />
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <Link
                      href={`/user/${user.user_id}`}
                      className={`${colors.text} block font-bold text-sm truncate transition-transform group-hover:scale-105 origin-left`}
                    >
                      {user.name}
                    </Link>
                    <div className="flex gap-2 text-[10px] text-slate-400 mt-0.5 whitespace-nowrap">
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                        {user.seconds}x 2º
                      </span>
                      <span className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-700"></span>
                        {user.thirds}x 3º
                      </span>
                    </div>
                  </div>
                </div>
              )}
              renderRight={(user) => (
                <div className="flex flex-col items-end pl-2 shrink-0">
                  <span className="font-black text-xl text-slate-200">{user.bottler_score}</span>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">Score</span>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="text-center text-slate-400 py-8">Nadie ha boteado todavía</div>
        ))}
    </Card>
  );
}
