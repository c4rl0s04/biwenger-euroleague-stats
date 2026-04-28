'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LabelList,
  Cell,
} from 'recharts';
import { useMemo, useState } from 'react';
import { ElegantCard } from '@/components/ui';
import { House, Plane, TrendingUp, Trophy, Ban } from 'lucide-react';
import { getShortRoundName } from '@/lib/utils/format';

// Recharts colors - using consistent premium palette
const HOME_COLOR = '#60a5fa'; // blue-400
const AWAY_COLOR = '#a78bfa'; // violet-400
const WIN_COLOR = '#34d399'; // emerald-400
const LOSS_COLOR = '#fda4af'; // rose-300 (lighter)

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, mode }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const isWin = d.result === 'win';

    let resultColorClass = 'text-white/50';
    let resultText = '';
    let Icon = null;

    if (mode === 'result') {
      if (isWin) {
        resultColorClass = 'text-emerald-400';
        resultText = 'Victoria';
        Icon = Trophy;
      } else {
        resultColorClass = 'text-rose-400';
        resultText = 'Derrota';
        Icon = Ban;
      }
    } else {
      if (d.isHome) {
        resultColorClass = 'text-blue-400';
        resultText = 'Casa';
        Icon = House;
      } else {
        resultColorClass = 'text-violet-400';
        resultText = 'Fuera';
        Icon = Plane;
      }
    }

    return (
      <div className="bg-black/30 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl min-w-[160px] animate-in fade-in zoom-in duration-200">
        <div className="text-[10px] text-white/40 font-black tracking-widest uppercase mb-2 border-b border-white/5 pb-2">
          {d.fullRound}
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className={`p-1.5 rounded-lg bg-white/5 ${resultColorClass}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-white/90">{d.rival}</span>
            <span
              className={`text-[9px] font-black uppercase tracking-tighter ${resultColorClass}`}
            >
              {mode === 'result' ? `${d.home_score} - ${d.away_score}` : resultText}
            </span>
          </div>
        </div>

        <div className="flex items-baseline gap-1">
          <span className={`text-2xl font-black ${d.isDNP ? 'text-white/20' : 'text-white'}`}>
            {d.isDNP ? 'DNP' : d.points}
          </span>
          {!d.isDNP && (
            <span className="text-[10px] font-bold text-white/40 uppercase">Puntos</span>
          )}
        </div>
      </div>
    );
  }
  return null;
};

// Custom Label for the points to handle negative values correctly
const CustomPointLabel = (props) => {
  const { x, y, width, height, value } = props;
  if (value === 0) return null;

  const isNegative = value < 0;
  // For negative bars, y is the 0-line and height is the distance down.
  // We want it significantly below the bottom edge of the bar.
  const labelY = isNegative ? y + height + 20 : y - 10;

  return (
    <text
      x={x + width / 2}
      y={labelY}
      fill="#ffffff"
      fontSize={10}
      fontWeight="900"
      textAnchor="middle"
    >
      {value}
    </text>
  );
};

export default function PlayerPointsGraph({ matches, playerTeam, className = '' }) {
  const [viewMode, setViewMode] = useState('location'); // 'location' | 'result'

  // Helper to normalize team names for comparison
  const normalize = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

  // Process data for graph
  const data = useMemo(() => {
    if (!matches || matches.length === 0) return [];

    return [...matches].reverse().map((match) => {
      const pTeamNorm = normalize(playerTeam);
      const hTeamNorm = normalize(match.home_team);
      const isHome =
        pTeamNorm &&
        hTeamNorm &&
        (pTeamNorm === hTeamNorm || pTeamNorm.includes(hTeamNorm) || hTeamNorm.includes(pTeamNorm));

      let result = 'loss';
      if (match.home_score !== null && match.away_score !== null) {
        if (isHome) {
          if (match.home_score > match.away_score) result = 'win';
        } else {
          if (match.away_score > match.home_score) result = 'win';
        }
      }

      return {
        name: getShortRoundName(match.round_name),
        fullRound: match.round_name,
        points: match.fantasy_points !== null ? match.fantasy_points : 0,
        isDNP: match.fantasy_points === null,
        rival: isHome ? match.away_team : match.home_team,
        isHome: isHome,
        home_score: match.home_score,
        away_score: match.away_score,
        result: result,
      };
    });
  }, [matches, playerTeam]);

  const averagePoints = useMemo(() => {
    const playedRounds = data.filter((d) => !d.isDNP);
    if (playedRounds.length === 0) return 0;
    return playedRounds.reduce((acc, curr) => acc + curr.points, 0) / playedRounds.length;
  }, [data]);

  const { yDomainMin, yDomainMax, ticks } = useMemo(() => {
    if (data.length === 0) return { yDomainMin: 0, yDomainMax: 10, ticks: [0, 5, 10] };

    const points = data.map((d) => d.points);
    const maxVal = Math.max(...points, 0);
    const minVal = Math.min(...points, 0);

    // Add more padding at the bottom for labels
    const maxWithPadding = Math.ceil(maxVal * 1.2) + 2;
    const minWithPadding = Math.floor(minVal * 1.4) - 8;

    const roundedMax = Math.ceil(maxWithPadding / 5) * 5;
    const roundedMin = Math.floor(minWithPadding / 5) * 5;

    const t = [];
    for (let i = roundedMin; i <= roundedMax; i += 5) t.push(i);

    return {
      yDomainMin: roundedMin,
      yDomainMax: Math.max(roundedMax, 15),
      ticks: t,
    };
  }, [data]);

  if (!matches || matches.length === 0) return null;

  return (
    <ElegantCard
      title="Evolución de Puntos"
      icon={TrendingUp}
      color="rose"
      className={`${className} min-h-[400px]`}
      actionRight={
        <div className="flex bg-black/40 backdrop-blur-md rounded-xl p-1 border border-white/5 shadow-inner">
          {[
            { id: 'location', label: 'Casa/Fuera' },
            { id: 'result', label: 'Resultado' },
          ].map((mode) => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id)}
              className={`px-4 py-1.5 text-[9px] font-black uppercase tracking-[0.1em] rounded-lg transition-all duration-300 cursor-pointer ${
                viewMode === mode.id
                  ? 'bg-white/10 text-white shadow-[0_0_15px_rgba(255,255,255,0.05)] border border-white/10'
                  : 'text-white/40 hover:text-white/70 hover:bg-white/5 border border-transparent'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>
      }
    >
      <div className="h-[280px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            key={viewMode}
            data={data}
            margin={{ top: 10, right: 0, left: -35, bottom: -10 }}
          >
            <CartesianGrid strokeDasharray="0" stroke="rgba(255,255,255,0.03)" vertical={false} />
            <XAxis
              dataKey="name"
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              dy={5}
            />
            <YAxis
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 9, fontWeight: 700 }}
              tickLine={false}
              axisLine={false}
              domain={[yDomainMin, yDomainMax]}
              ticks={ticks}
              dx={5}
            />
            <Tooltip
              cursor={{ fill: 'rgba(255,255,255,0.03)', radius: [8, 8, 0, 0] }}
              content={<CustomTooltip mode={viewMode} />}
            />
            <ReferenceLine
              y={averagePoints}
              stroke="rgba(255,255,255,0.15)"
              strokeDasharray="4 4"
            />

            {/* Shaded vertical zones for DNP rounds */}
            {data.map(
              (entry, index) =>
                entry.isDNP && (
                  <ReferenceLine
                    key={`dnp-${index}`}
                    x={entry.name}
                    stroke="#ff0000ff"
                    strokeDasharray="6 4"
                    opacity={0.7}
                    strokeWidth={10}
                  />
                )
            )}

            <Bar
              dataKey="points"
              radius={[6, 6, 0, 0]}
              barSize={32}
              animationDuration={800}
              animationEasing="ease-out"
            >
              {data.map((entry, index) => {
                let color = HOME_COLOR;
                if (viewMode === 'result') {
                  color = entry.result === 'win' ? WIN_COLOR : LOSS_COLOR;
                } else {
                  color = entry.isHome ? HOME_COLOR : AWAY_COLOR;
                }
                return (
                  <Cell
                    key={`cell-${index}`}
                    fill={color}
                    fillOpacity={0.8}
                    className="hover:fill-opacity-100 transition-all duration-300"
                  />
                );
              })}
              <LabelList dataKey="points" content={<CustomPointLabel />} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Footer / Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center gap-6">
          {viewMode === 'location' ? (
            <>
              <div className="flex items-center gap-2 group">
                <div
                  className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(96,165,250,0.4)]"
                  style={{ backgroundColor: HOME_COLOR }}
                />
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest group-hover:text-white/80 transition-colors">
                  Casa
                </span>
              </div>
              <div className="flex items-center gap-2 group">
                <div
                  className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(167,139,250,0.4)]"
                  style={{ backgroundColor: AWAY_COLOR }}
                />
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest group-hover:text-white/80 transition-colors">
                  Fuera
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-2 group">
                <div
                  className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.4)]"
                  style={{ backgroundColor: WIN_COLOR }}
                />
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest group-hover:text-white/80 transition-colors">
                  Victoria
                </span>
              </div>
              <div className="flex items-center gap-2 group">
                <div
                  className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(251,113,133,0.4)]"
                  style={{ backgroundColor: LOSS_COLOR }}
                />
                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest group-hover:text-white/80 transition-colors">
                  Derrota
                </span>
              </div>
            </>
          )}
        </div>

        <div className="bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest mr-2">
            Media
          </span>
          <span className="text-xs font-black text-white">
            {averagePoints.toFixed(1)} <span className="text-[9px] text-white/40">PTS</span>
          </span>
        </div>
      </div>
    </ElegantCard>
  );
}
