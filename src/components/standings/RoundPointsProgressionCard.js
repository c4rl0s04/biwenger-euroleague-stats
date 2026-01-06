'use client';

import { BarChart2 } from 'lucide-react';
import { useState, useMemo, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Card } from '@/components/ui';
import { getColorForUser } from '@/lib/constants/colors';
import { useApiData } from '@/lib/hooks/useApiData';

// Custom tooltip - defined outside component to avoid recreation on each render
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-800 border border-slate-700 rounded-lg p-3 shadow-xl z-50 pointer-events-none">
        <p className="text-slate-400 text-xs mb-2 font-medium">{label}</p>
        <div className="space-y-1">
          {payload
            .sort((a, b) => b.value - a.value)
            .map((entry, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
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

export default function RoundPointsProgressionCard() {
  const { data: progression = [], loading } = useApiData(
    '/api/standings/points-progression?scope=all'
  );
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // Process data for the chart
  const { chartData, users } = useMemo(() => {
    if (!progression.length) return { chartData: [], users: [] };

    // Get unique rounds and users
    const roundNames = [...new Set(progression.map((p) => p.round_name))];

    // Map of userId -> userName
    const userMap = new Map();
    progression.forEach((p) => {
      if (!userMap.has(p.user_id)) {
        userMap.set(p.user_id, p.name);
      }
    });

    // Pivot data
    const data = roundNames.map((round) => {
      const entry = { name: round.replace('Jornada ', 'J') };
      userMap.forEach((name, id) => {
        const stats = progression.find((p) => p.round_name === round && p.user_id === id);
        if (stats) {
          entry[String(id)] = stats.points; // Using raw points instead of cumulative_points
        }
      });
      return entry;
    });

    // Sort users by their latest round points for somewhat consistent legend ordering
    const lastRoundData = data[data.length - 1] || {};
    const sortedUsers = Array.from(userMap.entries())
      .map(([id, name]) => ({ id: String(id), name, finalPoints: lastRoundData[String(id)] || 0 }))
      .sort((a, b) => b.finalPoints - a.finalPoints);

    return {
      chartData: data,
      users: sortedUsers,
    };
  }, [progression]);

  // Initialize selectedUsers when users change (memoized to avoid unnecessary updates)
  const initializedUsers = useMemo(() => {
    return new Set(users.map((u) => u.id));
  }, [users]);

  // Use a ref-like pattern: if selectedUsers is empty and users exist, use initializedUsers
  const effectiveSelectedUsers =
    selectedUsers.size === 0 && users.length > 0 ? initializedUsers : selectedUsers;

  const toggleUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const toggleAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  return (
    <Card title="Puntos por Jornada" icon={BarChart2} color="blue" loading={loading}>
      {!loading && (
        <div className="space-y-4">
          {/* User Filter */}
          <div className="flex flex-wrap gap-2 pt-2">
            <button
              onClick={toggleAll}
              className={`px-3 py-1 text-xs !rounded-full border transition-all cursor-pointer focus:outline-none overflow-hidden ${
                effectiveSelectedUsers.size === users.length
                  ? 'bg-slate-700 border-slate-600 text-white'
                  : 'bg-transparent border-slate-700 text-slate-400 hover:border-slate-500'
              }`}
            >
              All
            </button>
            {users.map((user) => {
              const colors = getColorForUser(user.id, user.name);
              const isSelected = effectiveSelectedUsers.has(user.id);
              return (
                <button
                  key={user.id}
                  onClick={() => toggleUser(user.id)}
                  className={`px-3 py-1 text-xs !rounded-full border flex items-center gap-2 transition-all cursor-pointer focus:outline-none overflow-hidden ${
                    isSelected
                      ? 'bg-slate-800/50 border-slate-700 text-white'
                      : 'bg-transparent border-slate-800 text-slate-500 opacity-50'
                  }`}
                  style={{
                    borderColor: isSelected ? colors.stroke : undefined,
                    boxShadow: isSelected ? `0 0 10px -4px ${colors.stroke}` : 'none',
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: isSelected ? colors.stroke : '#64748b' }}
                  />
                  {user.name}
                </button>
              );
            })}
          </div>

          <div className="h-[500px] w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#334155"
                  opacity={0.3}
                  vertical={false}
                />
                <XAxis
                  dataKey="name"
                  stroke="#cbd5e1"
                  tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#cbd5e1"
                  tick={{ fill: '#cbd5e1', fontSize: 12, fontWeight: 500 }}
                  tickLine={false}
                  axisLine={false}
                  width={45}
                />
                <Tooltip content={<CustomTooltip />} />
                <Legend
                  wrapperStyle={{ paddingTop: '10px', fontSize: '10px' }}
                  formatter={(value) => (
                    <span className="text-slate-400 hover:text-white transition-colors ml-1">
                      {value}
                    </span>
                  )}
                />
                {users.map((user) => {
                  const colors = getColorForUser(user.id, user.name);
                  const isSelected = effectiveSelectedUsers.has(user.id);

                  return (
                    <Line
                      key={user.id}
                      type="monotone"
                      dataKey={user.id}
                      name={user.name}
                      stroke={colors.stroke}
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 0 }}
                      connectNulls
                      isAnimationActive={false}
                      hide={!isSelected}
                      legendType="circle"
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </Card>
  );
}
