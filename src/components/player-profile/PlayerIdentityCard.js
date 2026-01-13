'use client';

import Image from 'next/image';
import { Twitter, Instagram, Globe, User } from 'lucide-react';
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
  // Placeholder for social links - in a real app these would come from DB
  const socialLinks = [
    // { icon: Twitter, href: '#' },
    // { icon: Instagram, href: '#' }
  ];

  return (
    <div className="relative w-full bg-card border border-border/50 rounded-xl overflow-hidden shadow-sm">
      {/* Background with Team Colors/Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/95 to-secondary/20 pointer-events-none" />

      {/* Content Container */}
      <div className="relative flex flex-col md:flex-row h-full">
        {/* Owner Badge (Absolute Top Right) */}
        {player.owner_id && (
          <div className="absolute top-4 right-4 z-30 flex items-center gap-2 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-border/50 shadow-lg">
            {player.owner_icon ? (
              <div className="relative w-6 h-6 rounded-full overflow-hidden border border-border">
                <Image
                  src={player.owner_icon}
                  alt={player.owner_name}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center border border-primary/30">
                <User size={14} className="text-primary" />
              </div>
            )}
            <span
              className={`text-sm font-bold ${
                getColorForUser(player.owner_id, player.owner_name, player.owner_color_index).text
              }`}
            >
              {player.owner_name}
            </span>
          </div>
        )}

        {/* Left: Player Image (Cutout Style) */}
        <div className="w-full md:w-5/12 lg:w-4/12 relative min-h-[350px] md:min-h-[450px] self-end order-1 md:order-1 flex items-end justify-center">
          {/* Gradient behind image for depth */}
          <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-background to-transparent z-0 opacity-50" />

          {player.img ? (
            <Image
              src={player.img}
              alt={player.name}
              fill
              unoptimized={true}
              className="object-contain object-bottom z-10 drop-shadow-2xl"
              sizes="(max-width: 768px) 100vw, 500px"
              priority
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-secondary/30 z-10">
              <span className="text-6xl">👤</span>
            </div>
          )}
        </div>

        {/* Right: Info & Stats */}
        <div className="w-full md:w-7/12 lg:w-8/12 p-6 md:p-10 flex flex-col justify-center order-2 md:order-2 relative z-20">
          {/* Top Row: Name & Team Logo */}
          <div className="flex justify-between items-start mb-8 md:mb-12">
            <div className="space-y-2">
              {/* Team Name Small Label */}
              <div className="flex items-center gap-2 mb-2">
                {player.team_img && (
                  <div className="relative w-8 h-8 opacity-90">
                    <Image
                      src={player.team_img}
                      alt={player.team}
                      fill
                      className="object-contain"
                      unoptimized
                    />
                  </div>
                )}
                <span className="text-xl md:text-2xl font-bold text-muted-foreground/80 tracking-wide uppercase">
                  {player.team}
                </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-8xl font-black text-foreground tracking-tighter uppercase leading-[0.85]">
                {player.name}
              </h1>
              <div className="text-2xl md:text-3xl text-primary font-bold pt-2">
                {/* You might want to parse number if available in name string or DB */}
                <span>{player.position}</span>
              </div>
            </div>
          </div>

          {/* Divider */}
          <hr className="border-border/60 my-6 w-full opacity-50" />

          {/* Bio Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
            {/* Nationality/Team */}
            <div>
              <span className="block text-sm uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                Nacionalidad
              </span>
              <div className="text-2xl font-bold text-foreground">
                {/* Placeholder as we don't have nationality in DB yet usually */}
                Spain
              </div>
            </div>

            {/* Height */}
            <div>
              <span className="block text-sm uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                Altura
              </span>
              <div className="text-2xl font-bold text-foreground">
                {player.height ? `${(player.height / 100).toFixed(2)} m` : '-'}
              </div>
            </div>

            {/* Age / Born */}
            <div>
              <span className="block text-sm uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                Nacimiento
              </span>
              <div className="text-2xl font-bold text-foreground">{age ? `${age} años` : '-'}</div>
              {player.birth_date && (
                <span className="text-sm text-muted-foreground">
                  {new Date(player.birth_date).getFullYear()}
                </span>
              )}
            </div>

            {/* Weight */}
            <div>
              <span className="block text-sm uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                Peso
              </span>
              <div className="text-2xl font-bold text-foreground">
                {player.weight ? `${player.weight} kg` : '-'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
