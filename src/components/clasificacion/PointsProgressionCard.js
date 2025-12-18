'use client';

import { Activity } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';
import PremiumCard from '@/components/ui/PremiumCard';
import { getColorForUser } from '@/lib/constants/colors';

export default function PointsProgressionCard() {
  const [progression, setProgression] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/clasificacion/progression')
      .then(res => res.json())
      .then(result => {
        if (result.success) {
          setProgression(result.data.progression || []);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching progression:', err);
        setLoading(false);
      });
  }, []);

  // Process data for the chart
  const { chartData, users } = useMemo(() => {
    if (!progression.length) return { chartData: [], users: [] };

    // Get unique rounds and users
    const roundNames = [...new Set(progression.map(p => p.round_name))];
    
    // Map of userId -> userName for legend and lines
    const userMap = new Map();
    progression.forEach(p => {
      if (!userMap.has(p.user_id)) {
        userMap.set(p.user_id, p.name);
      }
    });

    // Pivot data: [{ name: 'J1', [userId1]: score, [userId2]: score }, ...]
    const data = roundNames.map(round => {
      const entry = { name: round.replace('Jornada ', 'J') };
      userMap.forEach((name, id) => {
        const stats = progression.find(p => p.round_name === round && p.user_id === id);
        if (stats) {
          entry[id] = stats.cumulative_points;
        }
      });
      return entry;
    });

    return { 
      chartData: data, 
      users: Array.from(userMap.entries()).map(([id, name]) => ({ id, name })) 
    };
  }, [progression]);

  // Custom tooltup
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl">
          <p className="text-slate-400 text-xs mb-2 font-medium">{label}</p>
          <div className="space-y-1">
            {payload
              .sort((a, b) => b.value - a.value)
              .map((entry, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-slate-300 w-20 truncate">{entry.name}</span>
                  <span className="text-white font-bold ml-auto">{entry.value}</span>
                </div>
              ))}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <PremiumCard
      title="Evolución de Puntos"
      icon={Activity}
      color="purple"
      loading={loading}
    >
      {!loading && (
        <div className="h-[300px] w-full mt-2 -ml-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 10, left: 0, bottom: 0 }}
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
                width={35}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend 
                wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }} 
                formatter={(value) => <span className="text-slate-400 hover:text-white transition-colors ml-1">{value}</span>}
              />
              {users.map(user => {
                const colors = getColorForUser(user.id, user.name);
                return (
                  <Line
                    key={user.id}
                    type="monotone"
                    dataKey={user.id}
                    name={user.name}
                    stroke={colors.stroke}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                    connectNulls
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </PremiumCard>
  );
}
