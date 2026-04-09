import { useState, useMemo } from 'react';
import { getColorForUser } from '@/lib/constants/colors';
import { TrendingUp, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui';
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

// Custom tooltip adapted for Recharts
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-lg p-3 shadow-2xl z-50 pointer-events-none min-w-[160px]">
        <p className="text-slate-400 text-xs mb-3 font-semibold uppercase tracking-wider border-b border-slate-700/50 pb-1.5">
          {label}
        </p>
        <div className="space-y-2">
          {payload
            .sort((a, b) => b.value - a.value)
            .map((entry, index) => {
              const isPartial = entry.payload[`${entry.dataKey}_partial`];
              return (
                <div key={index} className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-2 text-xs">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: entry.color }}
                    />
                    <span className="text-slate-300 w-24 truncate font-medium">{entry.name}</span>
                    <span className="text-white font-bold ml-auto">{entry.value}</span>
                  </div>
                  {isPartial && (
                    <div className="flex items-center gap-1 text-[9px] text-amber-400/80 font-bold ml-4 uppercase tracking-tight">
                      <AlertCircle className="w-2.5 h-2.5" />
                      Participación Parcial
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      </div>
    );
  }
  return null;
};

export function PerformanceCard({ data }) {
  const [selectedUsers, setSelectedUsers] = useState(new Set());

  // Process data for Recharts
  const { chartData, users } = useMemo(() => {
    if (!data || data.length === 0) return { chartData: [], users: [] };

    // Get unique rounds and users
    const rounds = [...new Set(data.map((d) => d.jornada))];
    // Sort rounds naturally
    rounds.sort((a, b) => {
      const numA = parseInt(a.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    const uniqueUsers = new Map();
    data.forEach((d) => {
      if (!uniqueUsers.has(d.user_id)) {
        uniqueUsers.set(d.user_id, {
          id: String(d.user_id),
          name: d.usuario,
          colorIndex: d.color_index,
        });
      }
    });

    // Pivot data
    const pivotedData = rounds.map((round) => {
      const entry = { name: round.replace(/Round |Jornada /i, 'J') };
      uniqueUsers.forEach((u) => {
        const stats = data.find((d) => d.jornada === round && String(d.user_id) === u.id);
        if (stats) {
          entry[u.id] = stats.aciertos;
          entry[`${u.id}_partial`] = stats.is_partial;
        } else {
          entry[u.id] = null;
          entry[`${u.id}_partial`] = false;
        }
      });
      return entry;
    });

    // Sort users by name for consistent list
    const sortedUsers = Array.from(uniqueUsers.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );

    return {
      chartData: pivotedData,
      users: sortedUsers,
    };
  }, [data]);

  // Logic for toggling users
  const effectiveSelectedUsers = useMemo(() => {
    return selectedUsers.size === 0 && users.length > 0
      ? new Set(users.map((u) => u.id))
      : selectedUsers;
  }, [selectedUsers, users]);

  const toggleUser = (userId) => {
    const newSelected = new Set(selectedUsers);
    if (newSelected.size === 0 && users.length > 0) {
      users.forEach((u) => newSelected.add(u.id));
    }

    if (newSelected.has(userId)) {
      newSelected.delete(userId);
    } else {
      newSelected.add(userId);
    }
    setSelectedUsers(newSelected);
  };

  const handleToggleAll = () => {
    if (selectedUsers.size === users.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(users.map((u) => u.id)));
    }
  };

  return (
    <Card title="Evolución de Aciertos" icon={TrendingUp} color="emerald" className="h-full">
      <div className="space-y-4">
        {/* User Filter Controls */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={handleToggleAll}
            className={`px-3 py-1 text-xs font-bold uppercase tracking-wider !rounded-full border transition-all cursor-pointer focus:outline-none overflow-hidden ${
              effectiveSelectedUsers.size === users.length
                ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400'
                : 'bg-transparent border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            Todos
          </button>
          {users.map((user) => {
            const colors = getColorForUser(user.id, user.name, user.colorIndex);
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
                  backgroundColor: isSelected ? `${colors.stroke}20` : undefined,
                }}
              >
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: isSelected ? colors.stroke : '#64748b' }}
                />
                <span className={isSelected ? 'text-foreground font-medium' : ''}>{user.name}</span>
              </button>
            );
          })}
        </div>

        <div className="h-[350px] w-full mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#334155"
                opacity={0.3}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                stroke="#64748b"
                tick={{ fill: '#64748b', fontSize: 10, fontWeight: 600 }}
                tickLine={false}
                axisLine={false}
                width={40}
                domain={[0, 10]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                wrapperStyle={{ paddingTop: '20px', fontSize: '10px' }}
                iconType="circle"
                formatter={(value) => (
                  <span className="text-slate-400 font-medium ml-1">{value}</span>
                )}
              />
              {users.map((user) => {
                const colors = getColorForUser(user.id, user.name, user.colorIndex);
                const isSelected = effectiveSelectedUsers.has(user.id);

                return (
                  <Line
                    key={user.id}
                    type="monotone"
                    dataKey={user.id}
                    name={user.name}
                    stroke={colors.stroke}
                    strokeWidth={isSelected ? 3 : 1}
                    dot={isSelected ? { r: 3, strokeWidth: 1, fill: colors.stroke } : false}
                    activeDot={{ r: 5, strokeWidth: 1, fill: '#fff', stroke: colors.stroke }}
                    connectNulls={true}
                    isAnimationActive={true}
                    hide={!isSelected}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </Card>
  );
}
