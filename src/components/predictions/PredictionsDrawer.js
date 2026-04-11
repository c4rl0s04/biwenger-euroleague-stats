'use client';

import React from 'react';
import { Zap, Trophy } from 'lucide-react';
import { getColorForUser } from '@/lib/constants/colors';
import { Drawer, BaseRow } from '@/components/ui';

/**
 * PredictionsDrawer
 * Specialized drawer for Predictions rankings (Clutch, Victorias).
 * Now using the standardized global BaseRow component for consistent styling.
 */
export default function PredictionsDrawer({
  isOpen,
  onClose,
  type, // 'clutch' | 'victorias'
  clutchStats = [],
  victoriasStats = [],
}) {
  const isClutch = type === 'clutch';

  const title = isClutch ? 'Ranking Clutch' : 'Ranking de Victorias';
  const subtitle = isClutch
    ? 'Rendimiento bajo presión (últimas 3 jornadas)'
    : 'Jornadas ganadas esta temporada';
  const Icon = isClutch ? Zap : Trophy;
  const color = isClutch ? 'blue' : 'purple';

  const data = isClutch ? clutchStats : victoriasStats;

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      icon={Icon}
      color={color}
      footer={
        <>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">
              Participantes
            </span>
            <span className="text-lg font-black text-white tabular-nums leading-none">
              {data.length}
            </span>
          </div>
          <div className="text-[9px] font-black uppercase text-zinc-700 tracking-[0.2em]">
            Clasificación Oficial
          </div>
        </>
      }
    >
      <div className="flex flex-col gap-1">
        {data.map((item, idx) => {
          // Resolve manager colors for the premium themed row
          const colorInfo = getColorForUser(item.user_id, item.usuario, item.color_index);

          const value = isClutch ? parseFloat(item.avg_last_3).toFixed(2) : item.victorias;

          return (
            <BaseRow
              key={item.user_id || idx}
              idx={idx}
              rank={idx + 1}
              isTop3={idx < 3}
              imageSrc={item.user_icon || item.img}
              name={item.usuario}
              managerId={item.user_id}
              linkPath={`/user/${item.user_id}`}
              primaryColor={colorInfo}
              secondaryColor={colorInfo}
              valueLabel={isClutch ? 'Avg Score' : 'Victorias'}
              valueText={value}
              isUser={true}
            />
          );
        })}

        {data.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-500 italic text-sm">
            No hay datos disponibles para este ranking.
          </div>
        )}
      </div>
    </Drawer>
  );
}
