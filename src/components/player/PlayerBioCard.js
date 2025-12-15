'use client';

import { Ruler, Scale, CalendarDays } from 'lucide-react';
import PremiumCard from '@/components/ui/PremiumCard';

function calculateAge(birthDate) {
  if (!birthDate) return null;
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export default function PlayerBioCard({ player, className = '' }) {
  const age = calculateAge(player.birth_date);
  
  return (
    <PremiumCard title="Biografía" icon={CalendarDays} color="emerald" className={`h-full ${className}`}>
        <div className="grid grid-cols-3 gap-3 h-full content-center">
            <div className="text-center p-3 bg-emerald-500/5 rounded-xl border border-emerald-500/10 flex flex-col justify-center items-center gap-1 hover:bg-emerald-500/10 transition-colors">
                <div className="text-emerald-400 mb-1">
                    <CalendarDays className="w-5 h-5" />
                </div>
                <div className="text-xl font-bold text-white">{age ? age : '-'}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Años</div>
            </div>
            
            <div className="text-center p-3 bg-blue-500/5 rounded-xl border border-blue-500/10 flex flex-col justify-center items-center gap-1 hover:bg-blue-500/10 transition-colors">
                 <div className="text-blue-400 mb-1">
                    <Ruler className="w-5 h-5" />
                </div>
                <div className="text-xl font-bold text-white">{player.height ? (player.height / 100).toFixed(2).replace('.', ',') : '-'}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Metros</div>
            </div>

            <div className="text-center p-3 bg-amber-500/5 rounded-xl border border-amber-500/10 flex flex-col justify-center items-center gap-1 hover:bg-amber-500/10 transition-colors">
                 <div className="text-amber-400 mb-1">
                    <Scale className="w-5 h-5" />
                </div>
                <div className="text-xl font-bold text-white">{player.weight ? player.weight : '-'}</div>
                <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Kg</div>
            </div>
        </div>
    </PremiumCard>
  );
}
