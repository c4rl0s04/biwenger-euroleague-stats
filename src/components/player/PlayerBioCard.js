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
        <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
                <div className="flex justify-center mb-1 text-slate-400">
                    <CalendarDays className="w-4 h-4" />
                </div>
                <div className="text-sm font-bold text-white">{age ? `${age} años` : '-'}</div>
                <div className="text-[10px] text-slate-500 uppercase">Edad</div>
            </div>
            
            <div className="text-center p-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
                 <div className="flex justify-center mb-1 text-slate-400">
                    <Ruler className="w-4 h-4" />
                </div>
                <div className="text-sm font-bold text-white">{player.height ? `${player.height}m` : '-'}</div>
                <div className="text-[10px] text-slate-500 uppercase">Altura</div>
            </div>

            <div className="text-center p-2 bg-slate-800/30 rounded-lg border border-slate-700/30">
                 <div className="flex justify-center mb-1 text-slate-400">
                    <Scale className="w-4 h-4" />
                </div>
                <div className="text-sm font-bold text-white">{player.weight ? `${player.weight}kg` : '-'}</div>
                <div className="text-[10px] text-slate-500 uppercase">Peso</div>
            </div>
        </div>
    </PremiumCard>
  );
}
