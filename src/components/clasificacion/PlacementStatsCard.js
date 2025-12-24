'use client';

import { Trophy, ArrowDownCircle } from 'lucide-react';
import { useApiData } from '@/lib/hooks/useApiData';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import PremiumCard from '@/components/ui/PremiumCard';
import { getColorForUser } from '@/lib/constants/colors';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl z-50">
        <p className="text-slate-300 text-sm font-bold mb-2">{label}</p>
        <div className="space-y-1">
           <div className="flex items-center gap-2 text-xs text-yellow-400">
             <Trophy size={12} />
             <span>Top 3: {payload[0].value} veces</span>
           </div>
           <div className="flex items-center gap-2 text-xs text-red-400">
             <ArrowDownCircle size={12} />
             <span>Bottom 3: {payload[1].value} veces</span>
           </div>
        </div>
      </div>
    );
  }
  return null;
};

export default function PlacementStatsCard() {
  const { data = [], loading } = useApiData('/api/clasificacion/placements');

  return (
    <PremiumCard
      title="Podios vs Descenso"
      icon={Trophy}
      color="amber"
      loading={loading}
    >
      {!loading && data.length > 0 && (
        <div className="w-full" style={{ height: `${Math.max(100, data.length * 65 + 40)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 0, right: 30, left: 0, bottom: 0 }}
              layout="vertical"
              barGap={2}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} horizontal={false} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={150}
                tick={{ fill: '#cbd5e1', fontSize: 13, fontWeight: 500 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{fill: 'transparent'}} />
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Bar 
                dataKey="top_3_count" 
                name="Top 3" 
                fill="#fbbf24" 
                radius={[0, 4, 4, 0]} 
                barSize={18}
                stackId="stack"
              />
              <Bar 
                dataKey="bottom_3_count" 
                name="Bottom 3" 
                fill="#f87171" 
                radius={[0, 4, 4, 0]} 
                barSize={18}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

    </PremiumCard>
  );
}
