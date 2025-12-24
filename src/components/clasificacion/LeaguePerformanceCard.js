'use client';

import { TrendingUp, TrendingDown } from 'lucide-react';
import { useApiData } from '@/lib/hooks/useApiData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell
} from 'recharts';
import PremiumCard from '@/components/ui/PremiumCard';
import { getColorForUser } from '@/lib/constants/colors';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl z-50">
        <p className="text-slate-300 text-sm font-bold mb-2">{data.name}</p>
        <div className="space-y-1">
           <div className="flex items-center gap-2 text-xs text-green-400">
             <TrendingUp size={12} />
             <span>Por encima media: {data.above_avg_count} veces</span>
           </div>
           <div className="flex items-center gap-2 text-xs text-red-400">
             <TrendingDown size={12} />
             <span>Por debajo media: {data.below_avg_count} veces</span>
           </div>
           <div className="text-xs text-slate-400 mt-2 border-t border-slate-700 pt-2">
             Dif. promedio: <span className={data.avg_diff > 0 ? "text-green-400" : "text-red-400"}>{data.avg_diff > 0 ? '+' : ''}{data.avg_diff} pts</span>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function LeaguePerformanceCard() {
  const { data = [], loading } = useApiData('/api/clasificacion/league-comparison');

  return (
    <PremiumCard
      title="Rendimiento vs Liga"
      icon={TrendingUp}
      color="cyan"
      loading={loading}
    >
      {!loading && data.length > 0 && (

        <div className="w-full" style={{ height: `${Math.max(100, data.length * 65 + 40)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 0, right: 30, left: -20, bottom: 0 }}
              layout="vertical"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} horizontal={false} />
              <XAxis 
                type="number" 
                hide 
              />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={150}
                tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(255,255,255,0.05)'}} />
              <ReferenceLine x={0} stroke="#475569" />
              <Bar 
                dataKey="avg_diff" 
                radius={[0, 4, 4, 0]} 
                barSize={18}
              >
                {data.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.avg_diff > 0 ? '#22d3ee' : '#f472b6'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </PremiumCard>
  );
}
