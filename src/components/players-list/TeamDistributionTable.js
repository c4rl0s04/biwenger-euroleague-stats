'use client';

import { useMemo } from 'react';
import { Shield } from 'lucide-react';
import StatsTable, { TableIdentity } from '@/components/ui/StatsTable';
import { getColorForUser } from '@/lib/constants/colors';

export default function TeamDistributionTable({ initialPlayers = [], owners = [] }) {
  const tableData = useMemo(() => {
    const teamMap = {};

    initialPlayers.forEach((p) => {
      if (!p.team_id) return;

      if (!teamMap[p.team_id]) {
        teamMap[p.team_id] = {
          team_id: p.team_id,
          team_name: p.team_name,
          team_img: p.team_img,
          total: 0,
          owned: 0,
          // Initialize manager columns
          ...owners.reduce((acc, o) => ({ ...acc, [`manager_${o.id}`]: 0 }), {}),
        };
      }

      const row = teamMap[p.team_id];
      row.total++;

      if (p.owner_id && p.owner_id !== 0) {
        row.owned++;
        row[`manager_${p.owner_id}`]++;
      }
    });

    return Object.values(teamMap).sort((a, b) => b.owned - a.owned);
  }, [initialPlayers, owners]);

  const columns = useMemo(() => {
    const baseCols = [
      {
        key: 'team_name',
        label: 'Equipo Euroleague',
        align: 'left',
        render: (val, row) => <TableIdentity name={row.team_name} image={row.team_img} size="sm" />,
      },
      {
        key: 'total',
        label: 'Total',
        align: 'center',
        className: 'text-muted-foreground font-bold',
      },
      {
        key: 'owned',
        label: 'Fichados',
        align: 'center',
        className: 'text-primary font-black',
      },
    ];

    const managerCols = owners.map((o) => {
      const userColor = getColorForUser(o.id, o.name, o.color_index);
      return {
        key: `manager_${o.id}`,
        label: o.name,
        align: 'center',
        className: (val) =>
          val > 0 ? `${userColor.text} font-black` : 'text-muted-foreground/30 font-normal',
        headerClassName: userColor.text,
      };
    });

    return [...baseCols, ...managerCols];
  }, [owners]);

  return (
    <StatsTable
      title="Distribución por Equipos Originales"
      icon={Shield}
      color="blue"
      data={tableData}
      columns={columns}
      showManagerColumn={false}
      defaultSort={{ key: 'owned', direction: 'desc' }}
    />
  );
}
