'use client';

import {
  BarChart2,
  Shield,
  Target,
  AlertCircle,
  Activity,
  Crosshair,
  Hand,
  Footprints,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Star,
  Flame,
} from 'lucide-react';
import { ElegantCard } from '@/components/ui';

// Helper for shooting bars
const ShootingBar = ({ label, pct, made, att, colorClass, barColorClass }) => (
  <div className="flex flex-col w-full">
    <div className="flex justify-between items-end mb-2">
      <span className="text-[10px] md:text-xs text-white/90 font-black tracking-[0.2em] uppercase">
        {label}
      </span>
      <div className="flex items-center gap-2">
        <span className="text-[10px] text-white/80">
          {made}/{att}
        </span>
        <span className={`text-base font-black ${colorClass}`}>{pct}%</span>
      </div>
    </div>
    <div className="h-1.5 bg-black/40 rounded-full overflow-hidden shadow-inner border border-white/5">
      <div
        className={`h-full rounded-full transition-all duration-1000 ${barColorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  </div>
);

// Helper for stat boxes
const StatBox = ({
  icon: Icon,
  label,
  total,
  avg,
  color,
  subLabel = 'Total',
  avgLabel = 'Media',
}) => (
  <div className="flex flex-col bg-black/20 rounded-xl p-3 border border-white/5 hover:bg-black/40 transition-colors group">
    <div className="flex justify-between items-start mb-2">
      <Icon className={`w-4 h-4 opacity-90 group-hover:opacity-100 transition-opacity ${color}`} />
      <span className="text-[10px] text-white font-black tracking-widest uppercase">{label}</span>
    </div>
    <div className="flex items-end justify-between mt-auto">
      <div className="flex flex-col">
        <span className="text-2xl font-black text-white leading-none">{total}</span>
        <span className="text-[9px] text-white/80 uppercase tracking-widest mt-1">{subLabel}</span>
      </div>
      <div className="flex flex-col text-right">
        <span className="text-lg font-bold text-white leading-none">{avg}</span>
        <span className="text-[9px] text-white/80 uppercase tracking-widest mt-1">{avgLabel}</span>
      </div>
    </div>
  </div>
);

export default function PlayerAdvancedStatsCard({ advancedStats, className = '' }) {
  if (!advancedStats) return null;
  const s = advancedStats;

  // Games played check to prevent division by zero
  const gp = Math.max(s.games_played || 1, 1);

  // Calculate percentages safely
  const calcPct = (made, att) => (att > 0 ? Math.round((made / att) * 100) : 0);

  const pct2 = calcPct(s.two_points_made, s.two_points_attempted);
  const pct3 = calcPct(s.three_points_made, s.three_points_attempted);
  const pctFT = calcPct(s.free_throws_made, s.free_throws_attempted);

  // Averages
  const avgReb = (s.rebounds / gp).toFixed(1);
  const avgAst = (s.assists / gp).toFixed(1);
  const avgStl = (s.steals / gp).toFixed(1);
  const avgBlk = (s.blocks / gp).toFixed(1);
  const avgTO = (s.turnovers / gp).toFixed(1);
  const avgMin = (s.minutes_played / gp).toFixed(1);

  return (
    <ElegantCard
      title="Estadísticas Avanzadas"
      icon={BarChart2}
      color="indigo"
      className={className}
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mt-4 items-stretch">
        {/* LEFT COLUMN: Key Records & Shooting */}
        <div className="lg:col-span-5 flex flex-col space-y-6 h-full">
          {/* Top Performance Row */}
          <div className="grid grid-cols-3 gap-3">
            {/* AVG */}
            <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center group hover:bg-white/[0.06] transition-all duration-300">
              <span className="text-[9px] font-black uppercase tracking-widest text-indigo-400 mb-1">
                Media Puntos
              </span>
              <span className="text-2xl font-black text-white tracking-tighter">
                {s.avg_real_points || '0.0'}
              </span>
            </div>

            {/* MAX */}
            <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center group hover:bg-white/[0.06] transition-colors">
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 mb-1">
                Máximo Puntos
              </span>
              <span className="text-2xl font-black text-white">{s.best_real_points || 0}</span>
            </div>

            {/* MIN */}
            <div className="bg-white/[0.03] p-4 rounded-2xl border border-white/5 flex flex-col items-center text-center group hover:bg-white/[0.06] transition-colors">
              <span className="text-[9px] font-black uppercase tracking-widest text-rose-400 mb-1">
                Mínimo Puntos
              </span>
              <span className="text-2xl font-black text-white">{s.worst_real_points || 0}</span>
            </div>
          </div>

          <div className="flex flex-col flex-1">
            <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 mb-5 pl-1">
              <Crosshair className="w-3.5 h-3.5" /> Eficiencia de Tiro
            </h4>

            <div className="bg-black/20 p-6 rounded-3xl border border-white/5 space-y-7 flex-1 flex flex-col justify-center">
              <ShootingBar
                label="Tiros de 2"
                pct={pct2}
                made={s.two_points_made}
                att={s.two_points_attempted}
                colorClass="text-blue-400"
                barColorClass="bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.4)]"
              />
              <ShootingBar
                label="Triples"
                pct={pct3}
                made={s.three_points_made}
                att={s.three_points_attempted}
                colorClass="text-cyan-400"
                barColorClass="bg-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]"
              />
              <ShootingBar
                label="Tiros Libres"
                pct={pctFT}
                made={s.free_throws_made}
                att={s.free_throws_attempted}
                colorClass="text-emerald-400"
                barColorClass="bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]"
              />
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Playmaking & Defense */}
        <div className="lg:col-span-7 flex flex-col h-full">
          <h4 className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/40 mb-5 pl-1">
            <Activity className="w-3.5 h-3.5" /> Impacto en Pista
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 flex-1">
            <StatBox
              icon={Hand}
              label="Rebotes"
              total={s.rebounds}
              avg={avgReb}
              color="text-amber-400"
            />
            <StatBox
              icon={Zap}
              label="Asist."
              total={s.assists}
              avg={avgAst}
              color="text-purple-400"
            />
            <StatBox
              icon={Footprints}
              label="Robos"
              total={s.steals}
              avg={avgStl}
              color="text-pink-400"
            />
            <StatBox
              icon={Shield}
              label="Tapones"
              total={s.blocks}
              avg={avgBlk}
              color="text-rose-400"
            />
            <StatBox
              icon={AlertCircle}
              label="Pérdidas"
              total={s.turnovers}
              avg={avgTO}
              color="text-orange-400"
            />

            <StatBox
              icon={Activity}
              label="PIR (Val.)"
              total={s.valuation}
              avg={s.avg_pir}
              color="text-indigo-400"
            />

            <StatBox
              icon={Zap}
              label="Ratio AST/PER"
              total={s.ast_to_ratio}
              avg="AST/TO"
              avgLabel="Ratio"
              color="text-amber-200"
            />

            <StatBox
              icon={Flame}
              label="Pts / 40 min"
              total={s.pts_per_40}
              avg="Standard"
              avgLabel="Rate"
              color="text-orange-500"
            />

            {/* Minutes Box */}
            <div className="flex flex-col bg-teal-500/10 rounded-xl p-3 border border-teal-500/20 shadow-[0_0_15px_rgba(20,184,166,0.05)] group">
              <div className="flex justify-between items-start mb-2">
                <Clock className="w-4 h-4 text-teal-300 opacity-100 group-hover:opacity-100 transition-opacity" />
                <span className="text-[10px] text-teal-100 font-black tracking-widest uppercase">
                  Minutos
                </span>
              </div>
              <div className="flex items-end justify-between mt-auto">
                <div className="flex flex-col">
                  <span className="text-2xl font-black text-white leading-none">
                    {s.minutes_played}
                  </span>
                  <span className="text-[9px] text-teal-200 uppercase tracking-widest mt-1">
                    Total
                  </span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-lg font-bold text-teal-100 leading-none">{avgMin}</span>
                  <span className="text-[9px] text-teal-200 uppercase tracking-widest mt-1">
                    Media
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom simple stats row */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5 group hover:bg-black/30 transition-colors">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/40 font-black tracking-widest uppercase mb-1">
                  Partidos Jugados
                </span>
                <span className="text-xl font-black text-white">
                  {s.games_played} / {gp}
                </span>
              </div>
              <Target className="w-5 h-5 text-white/10 group-hover:text-indigo-400/40 transition-colors" />
            </div>

            <div className="flex items-center justify-between bg-black/20 p-4 rounded-xl border border-white/5 group hover:bg-black/30 transition-colors">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/40 font-black tracking-widest uppercase mb-1">
                  Faltas Cometidas
                </span>
                <span className="text-xl font-black text-white">{s.fouls}</span>
              </div>
              <AlertCircle className="w-5 h-5 text-white/10 group-hover:text-orange-400/40 transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </ElegantCard>
  );
}
