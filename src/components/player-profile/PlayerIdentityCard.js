'use client';

import Image from 'next/image';
import { User, Globe } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';

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
  // Assuming getColorForUser returns strings like { bg: 'bg-blue-500/10', text: 'text-blue-500', ... }
  const ownerColors = player.owner_id
    ? getColorForUser(player.owner_id, player.owner_name, player.owner_color_index)
    : { bg: 'bg-gray-500', border: 'border-gray-500', text: 'text-white' };

  // Determine the halo color class based on the owner text color
  // It takes 'text-color-500' and converts it to 'bg-color-500/5'
  const haloColorClass =
    player.owner_id && ownerColors.text
      ? `${ownerColors.text.replace('text-', 'bg-')}/5`
      : 'bg-primary/5'; // Fallback if no owner

  return (
    <div className="relative w-full bg-card border border-border/40 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 group">
      {/* 1. Subtle Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-background to-background z-0" />

      {/* THE HALO EFFECT - Now using dynamic color */}
      <div
        className={`absolute -right-20 -top-20 w-64 h-64 rounded-full blur-3xl z-0 ${haloColorClass}`}
      />

      {/* 2. Main Layout Container */}
      <div className="relative flex flex-col sm:flex-row h-full z-10">
        {/* --- OWNER BADGE (Top Right) --- */}
        {player.owner_id && (
          <div
            className={`absolute top-3 right-3 z-30 flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border shadow-sm backdrop-blur-md transition-transform hover:scale-105 ${ownerColors.bg.replace('/10', '/80')} ${ownerColors.border} ${ownerColors.text}`}
          >
            {player.owner_icon ? (
              <div className="relative w-5 h-5 rounded-full overflow-hidden border border-white/30">
                <Image
                  src={player.owner_icon}
                  alt={player.owner_name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-black/10 flex items-center justify-center border border-white/20">
                <User size={12} className="text-current" />
              </div>
            )}
            <span className="text-xs font-bold drop-shadow-sm tracking-wide">
              {player.owner_name}
            </span>
          </div>
        )}

        {/* --- LEFT: PLAYER IMAGE --- */}
        {/* Adjusted width to 35% on desktop to prevent empty space issues */}
        <div className="w-full sm:w-[35%] relative min-h-[220px] sm:min-h-[280px] flex items-end justify-center sm:justify-end overflow-hidden">
          {/* Mobile-only background gradient for image separation */}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent sm:hidden z-10" />

          {player.img ? (
            <Image
              src={player.img}
              alt={player.name}
              fill
              unoptimized={true}
              className="object-contain object-bottom z-0 transition-transform duration-500 group-hover:scale-105 origin-bottom"
              sizes="(max-width: 768px) 100vw, 300px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-end justify-center bg-secondary/10 pb-8">
              <User size={80} className="text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* --- RIGHT: INFO CONTENT --- */}
        <div className="w-full sm:w-[65%] p-5 flex flex-col justify-center relative">
          {/* Header Section: Team & Name */}
          <div className="space-y-1 mb-6">
            <div className="flex items-center gap-2 text-muted-foreground">
              {player.team_img && (
                <div className="relative w-5 h-5 opacity-90 grayscale group-hover:grayscale-0 transition-all">
                  <Image
                    src={player.team_img}
                    alt={player.team}
                    fill
                    className="object-contain"
                    unoptimized
                  />
                </div>
              )}
              <span className="text-xs font-bold tracking-widest uppercase opacity-70">
                {player.team}
              </span>
            </div>

            <div className="flex flex-col items-start gap-2">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-foreground tracking-tight leading-none uppercase">
                {player.name}
              </h1>
              {/* Position Badge */}
              <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold bg-primary/10 text-primary border border-primary/20 uppercase tracking-wider">
                {player.position || 'N/A'}
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="h-px w-full bg-gradient-to-r from-border to-transparent mb-5" />

          {/* Compact Stats Row */}
          <div className="grid grid-cols-4 gap-2 md:gap-4 divide-x divide-border/60">
            <StatItem
              label="Edad"
              value={age ? age : '-'}
              sub={player.birth_date ? new Date(player.birth_date).getFullYear() : ''}
            />

            <StatItem
              label="Altura"
              value={player.height ? (player.height / 100).toFixed(2) : '-'}
              unit="m"
            />

            <StatItem label="Peso" value={player.weight || '-'} unit={player.weight ? 'kg' : ''} />

            <StatItem
              label="Nat."
              value="ES" // Placeholder for nationality code
              icon={<Globe size={12} className="opacity-50" />}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Sub-component for cleaner stats code
function StatItem({ label, value, unit, sub, icon }) {
  return (
    <div className="pl-3 first:pl-0 flex flex-col justify-between h-full">
      <span className="text-[10px] uppercase font-semibold text-muted-foreground/70 mb-1 flex items-center gap-1">
        {label} {icon}
      </span>
      <div className="flex flex-col leading-none">
        <span className="text-lg md:text-xl font-bold text-foreground tabular-nums tracking-tight">
          {value}
          <span className="text-xs font-medium text-muted-foreground ml-0.5">{unit}</span>
        </span>
        {sub && <span className="text-[10px] text-muted-foreground mt-0.5">{sub}</span>}
      </div>
    </div>
  );
}
