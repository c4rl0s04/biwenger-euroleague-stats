import { useState, useMemo } from 'react';
import { getColorForUser } from '@/lib/constants/colors';
import { TrendingUp } from 'lucide-react';
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
          id: String(d.user_id), // Ensure string ID for Recharts data keys
          name: d.usuario,
          colorIndex: d.color_index,
        });
      }
    });

    // Pivot data
    const pivotedData = rounds.map((round) => {
      const entry = { name: round.replace(/Round |Jornada /i, 'J') }; // Shorten names like J1, J2
      uniqueUsers.forEach((u, originalId) => {
        // u.id is String(d.user_id)
        // originalId is the key in the Map (can be number or string)

        const stats = data.find((d) => d.jornada === round && String(d.user_id) === u.id);
        if (stats) {
          entry[u.id] = stats.aciertos;
        } else {
          entry[u.id] = null;
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
      // Initialize with all
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
    // If all selected (explicit or implicit) -> Clear (implicit all, or explicit none? user wants toggle)
    // Behavior: Match RoundPointsProgressionCard
    // If showing all -> clear (empty set = all? No, in that component empty=implicit all)
    // Wait, in RoundPointsProgressionCard code:
    // const effectiveSelectedUsers = selectedUsers.size === 0 && users.length > 0 ? initializedUsers : selectedUsers;
    // toggleAll: if size === length -> set(empty). else -> set(all).
    // If set(empty), effective becomes ALL.
    // So "All" button creates a state where filters are cleared (showing all).
    // If I want to select NONE, I can't?
    // That's acceptable for this chart type.
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
            className={`px-3 py-1 text-xs !rounded-full border transition-all cursor-pointer focus:outline-none overflow-hidden ${
              effectiveSelectedUsers.size === users.length
                ? 'bg-primary/20 border-primary text-primary-foreground font-medium'
                : 'bg-transparent border-border text-muted-foreground hover:border-primary/50'
            }`}
          >
            All
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
                <span className={isSelected ? 'text-foreground' : ''}>{user.name}</span>
              </button>
            );
          })}
        </div>

        <div className="h-[350px] w-full mt-2">
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
                width={30}
                domain={[0, 10]} // Fixed domain for aciertos
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
                const colors = getColorForUser(user.id, user.name, user.colorIndex);
                const isSelected = effectiveSelectedUsers.has(user.id);

                return (
                  <Line
                    key={user.id}
                    type="natural"
                    dataKey={user.id}
                    name={user.name}
                    stroke={colors.stroke}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                    connectNulls={true} // User requested continuous lines
                    isAnimationActive={true}
                    hide={!isSelected}
                    legendType="circle"
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
