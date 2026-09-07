'use client';

import { Skull } from 'lucide-react';
import Link from 'next/link';
import { Card } from '@/components/ui';
import StatsList from '@/components/ui/StatsList';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

export default function JinxCard() {
  const { data = [], loading } = useApiData('/api/standings/jinx');

  return (
    <Card
      title="El Pupas (Rondas Malditas)"
      icon={Skull}
      color="purple"
      loading={loading}
      className="h-full flex flex-col"
    >
      {!loading &&
        (data.length > 0 ? (
          <div className="flex flex-col h-full overflow-hidden">
            <div className="min-h-[40px] flex items-center mb-3 flex-shrink-0">
              <p className="text-xs text-slate-300 font-medium italic px-2">
                Puntuación{' '}
                <span className="text-purple-400 font-bold not-italic">superior a la media</span>{' '}
                pero acabando en la{' '}
                <span className="text-purple-400 font-bold not-italic">mitad inferior</span>.
              </p>
            </div>

            <StatsList
              items={data}
              renderRight={(user) => (
                <div className="flex flex-col items-end pl-2">
                  <div className="flex items-center gap-1">
                    <Skull size={14} className="text-purple-500" />
                    <span className="font-black text-xl text-slate-200">{user.jinxed_count}</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400">
                    Jornadas
                  </span>
                </div>
              )}
            />
          </div>
        ) : (
          <div className="text-center text-slate-400 py-8">Nadie ha sido gafado</div>
        ))}
    </Card>
  );
}
