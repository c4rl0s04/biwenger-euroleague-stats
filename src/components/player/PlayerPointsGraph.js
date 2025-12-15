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
import { TrendingUp } from 'lucide-react';

export default function PlayerPointsGraph({ matches }) {
  // Process data for graph
  const data = useMemo(() => {
    if (!matches || matches.length === 0) return [];
    
    // Create a copy and reverse to show chronological order (Round 1 -> Current)
    return [...matches]
      .reverse()
      .map(match => ({
        name: match.round_name.replace('Jornada ', 'J'),
        points: match.fantasy_points,
        avg: match.fantasy_points // Placeholder for potential moving average
      }));
  }, [matches]);

  // Calculate average for reference line
  const averagePoints = useMemo(() => {
    if (data.length === 0) return 0;
    const sum = data.reduce((acc, curr) => acc + curr.points, 0);
    return sum / data.length;
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
              contentStyle={{ 
                backgroundColor: '#1e293b', 
                borderColor: '#475569', 
                color: '#f8fafc',
                borderRadius: '0.5rem',
                fontSize: '12px'
              }}
              itemStyle={{ color: '#f43f5e' }}
              labelStyle={{ color: '#94a3b8', marginBottom: '0.25rem' }}
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
