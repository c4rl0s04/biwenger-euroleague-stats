'use client';

import Image from 'next/image';
import { User, Globe, Activity, Ruler, Weight } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import { ElegantCard } from '@/components/ui';

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

export default function PlayerIdentityCard({ player }) {
  const age = calculateAge(player.birth_date);

  // Helper to extract color strings cleanly based on your constants utils
  const ownerColors = player.owner_id
    ? getColorForUser(player.owner_id, player.owner_name, player.owner_color_index)
    : { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-white' };

  // Determine the halo color class using statically available bg gradient from ownerColors
  const haloColorClass = player.owner_id ? `bg-gradient-to-br ${ownerColors.bg}` : 'bg-primary/5'; // Fallback if no owner

  return (
    <ElegantCard hideHeader padding="p-0" className="overflow-hidden group">
      {/* THE HALO EFFECT */}
      <div
        className={`absolute -right-20 -top-20 w-96 h-96 rounded-full blur-3xl z-0 pointer-events-none transition-colors duration-700 ${haloColorClass}`}
      />

      <div className="relative flex flex-col md:flex-row h-full min-h-[300px] z-10">
        {/* --- OWNER BADGE (Top Right) --- */}
        {player.owner_id && (
          <div
            className={`absolute top-4 right-4 z-30 flex items-center gap-2 pl-1.5 pr-4 py-1.5 rounded-full border shadow-lg backdrop-blur-xl transition-all duration-300 hover:scale-105 ${ownerColors.bg.replace('/10', '/80')} ${ownerColors.border} ${ownerColors.text}`}
          >
            {player.owner_icon && player.owner_icon !== '' ? (
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-white/30 shadow-inner">
                <Image
                  src={player.owner_icon}
                  alt={player.owner_name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-black/20 flex items-center justify-center border border-white/20 shadow-inner">
                <User size={14} className="text-current" />
              </div>
            )}
            <span className="text-xs font-black drop-shadow-md tracking-wider uppercase">
              {player.owner_name}
            </span>
          </div>
        )}

        {/* --- LEFT: PLAYER IMAGE --- */}
        <div className="w-full md:w-[45%] relative flex items-end justify-center pt-12 px-4 min-h-[280px]">
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 md:from-transparent to-transparent z-10" />

          {/* Subtle team watermark behind player */}
          {player.team_img && (
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] grayscale group-hover:grayscale-0 group-hover:opacity-10 transition-all duration-700 z-0 scale-[1.8]">
              <Image
                src={player.team_img}
                alt={player.team_name || 'Team Logo'}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
          )}

          {player.img ? (
            <div className="relative w-full aspect-[3/4] max-h-[360px] md:max-h-[460px] mt-auto z-20">
              <Image
                src={player.img}
                alt={player.name}
                fill
                unoptimized={true}
                className="object-contain object-bottom drop-shadow-2xl transition-transform duration-700 group-hover:scale-[1.03] origin-bottom"
                sizes="(max-width: 768px) 100vw, 500px"
                priority
              />
            </div>
          ) : (
            <div className="w-full aspect-[3/4] max-h-[360px] md:max-h-[460px] flex items-end justify-center bg-secondary/5 rounded-t-xl pb-8 z-20">
              <User size={120} className="text-muted-foreground/20" />
            </div>
          )}
        </div>

        {/* --- RIGHT: INFO CONTENT --- */}
        <div className="w-full md:w-[55%] p-6 md:p-8 lg:p-10 flex flex-col justify-center relative z-20">
          {/* Header Section: Team & Position */}
          <div className="flex items-center gap-4 mb-5">
            {player.team_img && player.team_img !== '' && (
              <div className="relative w-14 h-14 drop-shadow-lg group-hover:scale-110 transition-transform duration-500">
                <Image
                  src={player.team_img}
                  alt={player.team_name || 'Team Logo'}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            )}
            <div className="flex flex-col">
              <span className="text-xl md:text-2xl font-black tracking-[0.15em] text-primary uppercase">
                {player.team_name || player.team || 'Sin Equipo'}
              </span>
              <span
                className={`text-sm md:text-base font-black uppercase tracking-widest ${
                  !player.position
                    ? 'text-muted-foreground'
                    : player.position.toLowerCase().includes('base')
                      ? 'text-blue-400'
                      : player.position.toLowerCase().includes('alero')
                        ? 'text-green-400'
                        : player.position.toLowerCase().includes('pivot') ||
                            player.position.toLowerCase().includes('pívot')
                          ? 'text-red-400'
                          : 'text-muted-foreground'
                }`}
              >
                {player.position || 'N/A'}
              </span>
            </div>
          </div>

          {/* Name */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none uppercase mb-8 drop-shadow-lg max-w-full">
            {player.name}
          </h1>

          {/* Compact Stats Grid */}
          <div className="flex flex-col gap-4 md:gap-5 bg-black/30 rounded-2xl p-5 md:p-6 border border-white/5 backdrop-blur-sm shadow-inner">
            {/* Top Row: Numeric Stats */}
            <div className="grid grid-cols-3 gap-4 md:gap-6">
              <StatItem
                label="Edad"
                value={age ? age : '-'}
                sub={player.birth_date ? new Date(player.birth_date).getFullYear() : ''}
                icon={<Activity size={14} className="text-primary" />}
              />
              <StatItem
                label="Altura"
                value={player.height ? (player.height / 100).toFixed(2) : '-'}
                unit="m"
                icon={<Ruler size={14} className="text-emerald-400" />}
              />
              <StatItem
                label="Peso"
                value={player.weight || '-'}
                unit={player.weight ? 'kg' : ''}
                icon={<Weight size={14} className="text-orange-400" />}
              />
            </div>

            {/* Bottom Row: Nationality */}
            <div className="pt-4 border-t border-white/10">
              <div className="flex flex-col">
                <span className="text-[10px] sm:text-xs uppercase font-black text-muted-foreground/60 mb-1.5 flex items-center gap-1.5 tracking-wider">
                  <Globe size={14} className="text-blue-400" /> Nacionalidad
                </span>
                <span className="text-lg sm:text-xl md:text-2xl font-black text-white tracking-tight leading-none">
                  {player.country || '-'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ElegantCard>
  );
}

// Sub-component for cleaner stats code
function StatItem({ label, value, unit, sub, icon }) {
  return (
    <div className="flex flex-col h-full sm:border-l border-white/10 sm:pl-4 first:border-l-0 first:pl-0">
      <span className="text-[10px] sm:text-xs uppercase font-black text-muted-foreground/60 mb-1.5 flex items-center gap-1.5 tracking-wider">
        {icon} {label}
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-2xl sm:text-3xl font-black text-white tabular-nums tracking-tighter">
          {value}
          {unit && (
            <span className="text-sm font-bold text-muted-foreground ml-1 uppercase">{unit}</span>
          )}
        </span>
        {sub && (
          <span className="text-[10px] font-bold text-muted-foreground mt-1 uppercase tracking-wider">
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
