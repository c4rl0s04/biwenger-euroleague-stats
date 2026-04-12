'use client';

import { Trophy, Star, TrendingDown, Target, Skull } from 'lucide-react';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import { StatsList } from '@/components/ui';

/**
 * RecordsGrid - Displays league-wide records in a grid of cards.
 * @param {Object} props
 * @param {Array} props.leaderboardData - Aggregated stats for all users
 * @param {Array} props.users - List of all users in the league
 */
export default function RecordsGrid({ leaderboardData = [], users = [] }) {
  if (!leaderboardData || leaderboardData.length === 0) return null;

  // 1. DATA PREPARATION: Sort for each record type

  // Record: Highest Score Ever
  const maxScores = [...leaderboardData]
    .sort((a, b) => b.bestActual - a.bestActual)
    .map((d) => ({
      ...d,
      name: users.find((u) => u.id === d.userId)?.name,
      icon: users.find((u) => u.id === d.userId)?.icon,
      color_index: users.find((u) => u.id === d.userId)?.color_index,
      subtitle: d.bestActualRound ? `Jornada ${d.bestActualRound}` : 'No jugado',
      value: d.bestActual,
    }));

  // Record: Highest Potential Points
  const maxPotential = [...leaderboardData]
    .sort((a, b) => b.bestIdeal - a.bestIdeal)
    .map((d) => ({
      ...d,
      name: users.find((u) => u.id === d.userId)?.name,
      icon: users.find((u) => u.id === d.userId)?.icon,
      color_index: users.find((u) => u.id === d.userId)?.color_index,
      subtitle: d.bestIdealRoundNum ? `Jornada ${d.bestIdealRoundNum}` : 'No jugado',
      value: d.bestIdeal,
    }));

  // Record: Highest Single Round Points Lost
  const maxLost = [...leaderboardData]
    .sort((a, b) => b.maxLost - a.maxLost)
    .map((d) => ({
      ...d,
      name: users.find((u) => u.id === d.userId)?.name,
      icon: users.find((u) => u.id === d.userId)?.icon,
      color_index: users.find((u) => u.id === d.userId)?.color_index,
      subtitle: d.maxLostRoundNum ? `Jornada ${d.maxLostRoundNum}` : 'No jugado',
      value: `-${d.maxLost}`,
    }));

  // Record: Highest Efficiency %
  const maxEff = [...leaderboardData]
    .sort((a, b) => b.bestEfficiency - a.bestEfficiency)
    .map((d) => ({
      ...d,
      name: users.find((u) => u.id === d.userId)?.name,
      icon: users.find((u) => u.id === d.userId)?.icon,
      color_index: users.find((u) => u.id === d.userId)?.color_index,
      subtitle: d.bestEffRound ? `Jornada ${d.bestEffRound}` : 'No jugado',
      value: `${d.bestEfficiency}%`,
    }));

  // Record: Lowest Efficiency %
  const lowestEff = [...leaderboardData]
    .sort((a, b) => a.worstEfficiency - b.worstEfficiency)
    .map((d) => ({
      ...d,
      name: users.find((u) => u.id === d.userId)?.name,
      icon: users.find((u) => u.id === d.userId)?.icon,
      color_index: users.find((u) => u.id === d.userId)?.color_index,
      subtitle: d.worstEffRound ? `Jornada ${d.worstEffRound}` : 'No jugado',
      value: `${d.worstEfficiency}%`,
    }));

  // Record: Lowest Score (Wall of Shame)
  const lowestScores = [...leaderboardData]
    .sort((a, b) => a.worstActual - b.worstActual)
    .map((d) => ({
      ...d,
      name: users.find((u) => u.id === d.userId)?.name,
      icon: users.find((u) => u.id === d.userId)?.icon,
      color_index: users.find((u) => u.id === d.userId)?.color_index,
      subtitle: d.worstActualRound ? `Jornada ${d.worstActualRound}` : 'No jugado',
      value: d.worstActual,
    }));

  const renderCard = (title, icon, color, items, valueColor, info) => (
    <ElegantCard title={title} icon={icon} color={color} info={info}>
      <div className="flex flex-col gap-1">
        <StatsList
          items={items}
          renderRight={(item) => (
            <span className={`text-sm font-black ${valueColor}`}>{item.value}</span>
          )}
        />
      </div>
    </ElegantCard>
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      {renderCard(
        'Puntos de Oro',
        Trophy,
        'yellow',
        maxScores,
        'text-emerald-400',
        'Récord de puntos conseguidos en una sola jornada.'
      )}
      {renderCard(
        'Potencial Máximo',
        Star,
        'purple',
        maxPotential,
        'text-purple-400',
        'La mayor puntuación que podrías haber obtenido con tu plantilla si hubieras elegido la alineación perfecta.'
      )}
      {renderCard(
        'Capitanes de Barco',
        Target,
        'emerald',
        maxEff,
        'text-sky-400',
        'Mayor eficiencia técnica en una jornada (porcentaje de puntos reales sobre el potencial máximo).'
      )}
      {renderCard(
        'Dolor en el Banquillo',
        TrendingDown,
        'red',
        maxLost,
        'text-red-500',
        'Récord de puntos perdidos en una sola jornada por no haber alineado a los mejores jugadores.'
      )}
      {renderCard(
        'Naufragios',
        Target,
        'sky',
        lowestEff,
        'text-amber-500',
        'Peor eficiencia en una sola jornada. Muestra el día con más errores en la elección de jugadores.'
      )}
      {renderCard(
        'Puntos de Barro',
        Skull,
        'zinc',
        lowestScores,
        'text-zinc-500',
        'Puntuación más baja obtenida en una jornada (mínimo histórico).'
      )}
    </div>
  );
}
