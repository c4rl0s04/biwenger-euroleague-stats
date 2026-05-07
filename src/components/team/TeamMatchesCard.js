'use client';

import { Calendar, ChevronRight, MapPin, Clock, Trophy } from 'lucide-react';
import { ElegantCard } from '@/components/ui';
import Image from 'next/image';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function TeamMatchesCard({ upcoming, recent }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Upcoming Matches */}
      <ElegantCard title="Próximos Partidos" icon={Calendar} color="blue">
        <div className="space-y-4">
          {upcoming && upcoming.length > 0 ? (
            upcoming.map((match, idx) => <MatchRow key={idx} match={match} type="upcoming" />)
          ) : (
            <p className="text-center py-8 text-white/20 italic">No hay partidos programados</p>
          )}
        </div>
      </ElegantCard>

      {/* Recent Results */}
      <ElegantCard title="Últimos Resultados" icon={Trophy} color="emerald">
        <div className="space-y-4">
          {recent && recent.length > 0 ? (
            recent.map((match, idx) => <MatchRow key={idx} match={match} type="recent" />)
          ) : (
            <p className="text-center py-8 text-white/20 italic">No hay resultados recientes</p>
          )}
        </div>
      </ElegantCard>
    </div>
  );
}

function MatchRow({ match, type }) {
  const isUpcoming = type === 'upcoming';
  const matchDate = new Date(match.date);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] hover:bg-white/[0.06] transition-all p-4 group">
      <div className="flex items-center justify-between gap-4">
        {/* Date / Round Info */}
        <div className="flex flex-col min-w-[90px]">
          <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1">
            {match.round_name || 'Euroleague'}
          </span>
          <span className="text-sm font-black text-white uppercase tracking-tight">
            {format(matchDate, 'd MMM', { locale: es })}
          </span>
          <span className="text-xs font-bold text-white/60 uppercase">
            {format(matchDate, 'HH:mm')}
          </span>
        </div>

        {/* Teams Cluster */}
        <div className="flex-1 flex items-center justify-center gap-4">
          <Link
            href={`/team/${match.home_id}`}
            className="flex flex-col items-center gap-2 w-24 group/team hover:scale-105 transition-transform duration-300"
          >
            <div className="relative w-10 h-10 group-hover/team:drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-all">
              <Image
                src={match.home_img}
                alt={match.home_team}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="text-[10px] font-bold text-white/60 group-hover/team:text-white transition-colors truncate w-full text-center">
              {match.home_team}
            </span>
          </Link>

          <div className="flex flex-col items-center justify-center min-w-[60px]">
            {isUpcoming ? (
              <span className="text-sm font-black text-white/40 uppercase tracking-widest">VS</span>
            ) : (
              <div className="flex items-center gap-2">
                <span
                  className={`text-xl font-black ${match.home_score > match.away_score ? 'text-white' : 'text-white/40'}`}
                >
                  {match.home_score}
                </span>
                <span className="text-white/20">-</span>
                <span
                  className={`text-xl font-black ${match.away_score > match.home_score ? 'text-white' : 'text-white/40'}`}
                >
                  {match.away_score}
                </span>
              </div>
            )}
          </div>

          <Link
            href={`/team/${match.away_id}`}
            className="flex flex-col items-center gap-2 w-24 group/team hover:scale-105 transition-transform duration-300"
          >
            <div className="relative w-10 h-10 group-hover/team:drop-shadow-[0_0_8px_rgba(255,255,255,0.2)] transition-all">
              <Image
                src={match.away_img}
                alt={match.away_team}
                fill
                className="object-contain"
                unoptimized
              />
            </div>
            <span className="text-[10px] font-bold text-white/60 group-hover/team:text-white transition-colors truncate w-full text-center">
              {match.away_team}
            </span>
          </Link>
        </div>

        {/* Difficulty / Status */}
        {isUpcoming && match.difficulty && (
          <div className="hidden sm:flex flex-col items-end min-w-[70px]">
            <span
              className={`text-[9px] font-black px-2 py-0.5 rounded-md border ${
                match.difficulty === 'Fácil'
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                  : match.difficulty === 'Duro'
                    ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                    : 'bg-blue-500/10 border-blue-500/20 text-blue-400'
              }`}
            >
              {match.difficulty}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
