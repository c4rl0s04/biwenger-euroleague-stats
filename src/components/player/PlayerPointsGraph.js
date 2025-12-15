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
  LabelList
} from 'recharts';
import { useMemo } from 'react';
import PremiumCard from '@/components/ui/PremiumCard';
import { House, Plane, TrendingUp } from 'lucide-react';

// Custom Tooltip Component (defined outside to avoid re-creation)
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const d = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl pointer-events-none"> {/* Added pointer-events-none to prevent flickering */}
         <div className="text-slate-400 text-xs mb-1 font-medium">{d.fullRound}</div>
         <div className="flex items-center gap-2 mb-2">
            {d.isHome ? <House className="w-3 h-3 text-blue-400" /> : <Plane className="w-3 h-3 text-slate-400" />}
            <span className="text-white text-sm font-semibold">{d.rival}</span>
         </div>
         <div className="text-rose-400 font-bold text-lg">
            {d.isDNP ? (
               <span className="text-slate-500">No Jugado</span> 
            ) : (
               <>
                 {d.points} <span className="text-xs font-normal text-rose-400/70">pts</span>
               </>
            )}
         </div>
      </div>
    );
  }
  return null;
};

export default function PlayerPointsGraph({ matches, playerTeam }) {
  // Helper to normalize team names for comparison (reused for consistency)
  const normalize = (str) => str?.toLowerCase().replace(/[^a-z0-9]/g, '') || '';

  // Process data for graph
  const data = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    
    // Create a copy and reverse to show chronological order (Round 1 -> Current)
    return [...matches]
      .reverse()
      .map(match => {
        // Determine Rival for Tooltip
        const pTeamNorm = normalize(playerTeam);
        const hTeamNorm = normalize(match.home_team);
        const isHome = pTeamNorm && hTeamNorm && (pTeamNorm === hTeamNorm || pTeamNorm.includes(hTeamNorm) || hTeamNorm.includes(pTeamNorm));
        
        return {
          name: match.round_name.replace('Jornada ', 'J'),
          fullRound: match.round_name,
          points: match.fantasy_points !== null ? match.fantasy_points : 0, // Zero height for DNP
          isDNP: match.fantasy_points === null, // Flag for tooltip
          rival: isHome ? match.away_team : match.home_team,
          isHome: isHome,
          avg: match.fantasy_points
        };
      });
  }, [matches, playerTeam]);



  // Calculate average for reference line (excluding DNPs)
  const averagePoints = useMemo(() => {
    const playedRounds = data.filter(d => !d.isDNP);
    if (playedRounds.length === 0) return 0;
    const sum = playedRounds.reduce((acc, curr) => acc + curr.points, 0);
    return sum / playedRounds.length;
  }, [data]);

  // Calculate ticks strictly at multiples of 5
  const { yDomainMax, ticks } = useMemo(() => {
    if (data.length === 0) return { yDomainMax: 10, ticks: [0, 5, 10] };
    
    const maxVal = Math.max(...data.map(d => d.points), 0);
    // Add padding (15%) then round to next multiple of 5
    const maxWithPadding = Math.ceil(maxVal * 1.15);
    const roundedMax = Math.ceil(maxWithPadding / 5) * 5;
    
    // Generate ticks: 0, 5, 10, ... roundedMax
    const t = [];
    for (let i = 0; i <= roundedMax; i += 5) {
      t.push(i);
    }
    
    return { yDomainMax: roundedMax, ticks: t };
  }, [data]);

  if (!matches || matches.length === 0) return null;

  return (
    <PremiumCard
      title="Evolución de Puntos"
      icon={TrendingUp}
      color="rose"
      className="lg:col-span-2 min-h-[350px]"
    >
      <div className="h-[280px] w-full mt-2">
        <ResponsiveContainer width="100%" height="100%">
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
              content={<CustomTooltip />}
            />
            <ReferenceLine y={averagePoints} stroke="#94a3b8" strokeDasharray="3 3" opacity={0.5} label={{ value: 'Avg', position: 'insideRight', fill: '#94a3b8', fontSize: 10 }} />
            <Bar 
              dataKey="points" 
              fill="#f43f5e" 
              radius={[4, 4, 0, 0]}
              animationDuration={1500}
            >
              <LabelList dataKey="points" position="top" fill="#f43f5e" fontSize={10} fontWeight="bold" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex justify-between items-center px-4 mt-2">
         <div className="text-xs text-slate-500">
            Jornada {data[0]?.name} - {data[data.length - 1]?.name}
         </div>
         <div className="text-xs text-rose-400 font-medium">
             Media: {averagePoints.toFixed(1)} pts
         </div>
      </div>
    </PremiumCard>
  );
}
