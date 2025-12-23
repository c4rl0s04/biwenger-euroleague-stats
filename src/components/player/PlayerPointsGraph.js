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
  Cell
} from 'recharts';
import { useMemo, useState } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import { House, Plane, TrendingUp, Trophy, Ban } from 'lucide-react';

// Colors
const HOME_COLOR = '#3b82f6'; // blue-500
const AWAY_COLOR = '#a855f7'; // purple-500
const WIN_COLOR = '#22c55e'; // green-500
const LOSS_COLOR = '#ef4444'; // red-500

// Custom Tooltip Component
const CustomTooltip = ({ active, payload, label, mode }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    const isWin = d.result === 'win';
    // Fallback everything else to Loss if draws are impossible
    const isLoss = !isWin; 

    let resultColor = 'text-slate-400';
    let resultText = '';
    let resultIcon = null;

    if (mode === 'result') {
      if (isWin) { resultColor = 'text-green-500'; resultText = 'Victoria'; resultIcon = <Trophy className="w-3 h-3" />; }
      else { resultColor = 'text-red-500'; resultText = 'Derrota'; resultIcon = <Ban className="w-3 h-3" />; }
    } else {
       if (d.isHome) { resultColor = 'text-blue-400'; resultText = 'Casa'; resultIcon = <House className="w-3 h-3" />; }
       else { resultColor = 'text-purple-400'; resultText = 'Fuera'; resultIcon = <Plane className="w-3 h-3" />; }
    }

    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl pointer-events-none">
         <div className="text-slate-400 text-xs mb-1 font-medium">{d.fullRound}</div>
         <div className="flex items-center gap-2 mb-2">
            <span className={resultColor}>{resultIcon}</span>
            <span className="text-white text-sm font-semibold">{d.rival}</span>
            <span className={`text-xs px-1.5 py-0.5 rounded ${mode === 'result' ? 'bg-slate-700 text-slate-300' : (d.isHome ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400')}`}>
              {mode === 'result' ? `${d.home_score} - ${d.away_score}` : resultText}
            </span>
         </div>
         <div className={`font-bold text-lg ${mode === 'result' && !d.isDNP ? (isWin ? 'text-green-500' : 'text-red-500') : (d.isDNP ? 'text-slate-500' : (d.isHome ? 'text-blue-400' : 'text-purple-400'))}`}>
            {d.isDNP ? (
               <span className="text-slate-500">No Jugado</span> 
            ) : (
               <>
                 {d.points} <span className="text-xs font-normal opacity-70">pts</span>
               </>
            )}
         </div>
      </div>
    );
  }
  return null;
};

export default function PlayerPointsGraph({ matches, playerTeam }) {
  const [viewMode, setViewMode] = useState('location'); // 'location' | 'result'

  // Helper to normalize team names for comparison
  const normalize = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

  // Process data for graph
  const data = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    
    return [...matches]
      .reverse()
      .map(match => {
        // Determine Rival & Location
        const pTeamNorm = normalize(playerTeam);
        const hTeamNorm = normalize(match.home_team);
        const isHome = pTeamNorm && hTeamNorm && (pTeamNorm === hTeamNorm || pTeamNorm.includes(hTeamNorm) || hTeamNorm.includes(pTeamNorm));
        
        // Determine Result (Simple Win/Loss)
        let result = 'loss'; // Default to loss
        if (match.home_score !== null && match.away_score !== null) {
            if (isHome) {
                if (match.home_score > match.away_score) result = 'win';
            } else {
                if (match.away_score > match.home_score) result = 'win';
            }
        }

        return {
          name: match.round_name.replace('Jornada ', 'J'),
          fullRound: match.round_name,
          points: match.fantasy_points !== null ? match.fantasy_points : 0,
          isDNP: match.fantasy_points === null,
          rival: isHome ? match.away_team : match.home_team,
          isHome: isHome,
          home_score: match.home_score,
          away_score: match.away_score,
          result: result,
          avg: match.fantasy_points
        };
      });
  }, [matches, playerTeam]);

  // Calculate average for reference line
  const averagePoints = useMemo(() => {
    const playedRounds = data.filter(d => !d.isDNP);
    if (playedRounds.length === 0) return 0;
    const sum = playedRounds.reduce((acc, curr) => acc + curr.points, 0);
    return sum / playedRounds.length;
  }, [data]);

  // Calculate ticks
  const { yDomainMax, ticks } = useMemo(() => {
    if (data.length === 0) return { yDomainMax: 10, ticks: [0, 5, 10] };
    const maxVal = Math.max(...data.map(d => d.points), 0);
    const maxWithPadding = Math.ceil(maxVal * 1.15);
    const roundedMax = Math.ceil(maxWithPadding / 5) * 5;
    const t = [];
    for (let i = 0; i <= roundedMax; i += 5) t.push(i);
    return { yDomainMax: roundedMax, ticks: t };
  }, [data]);

  if (!matches || matches.length === 0) return null;

  return (
    <PremiumCard
      title="Evolución de Puntos"
      icon={TrendingUp}
      color="rose"
      className="lg:col-span-2 min-h-[350px]"
      actionRight={
        <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700/50">
          <button
            onClick={() => setViewMode('location')}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
              viewMode === 'location' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            Casa/Fuera
          </button>
          <button
            onClick={() => setViewMode('result')}
            className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all ${
              viewMode === 'result' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
            }`}
          >
            Resultado
          </button>
        </div>
      }
    >
      <div className="h-[280px] w-full mt-2 min-w-0">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
          <BarChart
            data={data}
            margin={{ top: 10, right: 30, left: -10, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} vertical={false} />
            <XAxis 
              dataKey="name" 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis 
              stroke="#94a3b8" 
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              domain={[0, yDomainMax]}
              ticks={ticks}
              allowDecimals={false}
            />
            <Tooltip 
              cursor={{ fill: '#334155', opacity: 0.4 }}
              content={<CustomTooltip mode={viewMode} />}
            />
            <ReferenceLine y={averagePoints} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.5} label={{ value: 'Avg', position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
            <Bar 
              dataKey="points" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            >
              {data.map((entry, index) => {
                let color = HOME_COLOR;
                if (viewMode === 'result') {
                    color = entry.result === 'win' ? WIN_COLOR : LOSS_COLOR;
                } else {
                    color = entry.isHome ? HOME_COLOR : AWAY_COLOR;
                }
                return (
                    <Cell key={`cell-${index}`} fill={color} />
                );
              })}
              <LabelList 
                dataKey="points" 
                position="top" 
                fontSize={10} 
                fontWeight="bold"
                formatter={(value) => value}
                fill="#94a3b8"
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      {/* Legend */}
      <div className="flex justify-between items-center px-4 mt-2 h-6">
        <div className="flex items-center gap-4 transition-all duration-300">
          {viewMode === 'location' ? (
              <>
                <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: HOME_COLOR }} />
                    <span className="text-xs text-slate-400">Casa</span>
                </div>
                <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: AWAY_COLOR }} />
                    <span className="text-xs text-slate-400">Fuera</span>
                </div>
              </>
          ) : (
              <>
                <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: WIN_COLOR }} />
                    <span className="text-xs text-slate-400">Victoria</span>
                </div>
                <div className="flex items-center gap-1.5 animate-in fade-in zoom-in duration-300">
                    <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: LOSS_COLOR }} />
                    <span className="text-xs text-slate-400">Derrota</span>
                </div>
              </>
          )}
        </div>
        <div className="text-xs text-slate-400 font-medium">
            Media: {averagePoints.toFixed(1)} pts
        </div>
      </div>
    </PremiumCard>
  );
}
