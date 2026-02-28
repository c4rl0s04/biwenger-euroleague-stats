import React, { useEffect, useState } from 'react';
import { X, TrendingUp, AlertTriangle, CheckCircle, Database, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

export default function PlayerAnalysisModal({ isOpen, onClose, player }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const fetchDetails = async () => {
      if (!isOpen || !player?.player_id) return;

      try {
        setLoading(true);
        const res = await fetch(`/api/players/${player.player_id}/stats`);
        const data = await res.json();

        if (isMounted && data.success) {
          setDetails(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch player details', error);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchDetails();

    return () => {
      isMounted = false;
    };
  }, [isOpen, player]);

  if (!isOpen || !player) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        >
          {/* Header */}
          <div className="p-6 border-b border-zinc-800 flex justify-between items-start bg-zinc-900/50">
            <div className="flex items-center space-x-4">
              <div className="relative h-16 w-16 rounded-full overflow-hidden bg-zinc-800 border-2 border-zinc-700">
                {player.img ? (
                  <Image src={player.img} alt={player.name} fill className="object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-zinc-600 font-bold text-2xl">
                    ?
                  </div>
                )}
              </div>
              <div>
                <h2 className="text-2xl font-black text-white">{player.name}</h2>
                <div className="flex items-center text-sm text-zinc-400 space-x-2 mt-1">
                  <span>{player.position}</span>
                  <span>•</span>
                  <div className="flex items-center space-x-1">
                    {player.team_img ? (
                      <Image src={player.team_img} alt={player.team} width={16} height={16} />
                    ) : null}
                    <span>{player.team}</span>
                  </div>
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white rounded-full transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-6">
            {/* Price & Value Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                  Precio Actual
                </span>
                <span className="text-xl font-black text-white">
                  {new Intl.NumberFormat('es-ES').format(player.price)} €
                </span>
                <div
                  className={`text-xs mt-1 font-medium ${player.price_trend > 0 ? 'text-green-400' : 'text-red-400'}`}
                >
                  {player.price_trend > 0 ? 'Sube ' : 'Baja '}
                  {new Intl.NumberFormat('es-ES').format(Math.abs(player.price_trend))} €
                </div>
              </div>

              <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                <span className="text-xs font-bold text-zinc-500 uppercase block mb-1 flex items-center">
                  Valor (Pts/M) <Database size={12} className="ml-1" />
                </span>
                <span className="text-xl font-black text-blue-400">{player.value_score}</span>
                <div className="text-xs mt-1 text-zinc-400 font-medium">Rentabilidad estimada</div>
              </div>

              <div className="bg-zinc-800/50 p-4 rounded-xl border border-zinc-800">
                <span className="text-xs font-bold text-zinc-500 uppercase block mb-1">
                  Forma (Últimos 3)
                </span>
                <span className="text-xl font-black text-emerald-400">
                  {player.avg_recent_points.toFixed(1)}
                </span>
                <div className="text-xs mt-1 text-zinc-400 font-medium">
                  Pts: {player.recent_scores || '-'}
                </div>
              </div>
            </div>

            {/* Next Match */}
            <div className="bg-blue-900/10 border border-blue-900/30 p-5 rounded-xl">
              <h3 className="text-sm font-bold text-blue-400 uppercase flex items-center mb-3">
                <Calendar size={16} className="mr-2" /> Próximo Partido
              </h3>
              {player.next_opponent_id ? (
                <div className="flex items-center space-x-3">
                  <span className="text-zinc-300">vs</span>
                  {player.next_opponent_img ? (
                    <Image
                      src={player.next_opponent_img}
                      alt={player.next_opponent_name}
                      width={24}
                      height={24}
                    />
                  ) : null}
                  <span className="font-bold text-white">{player.next_opponent_name}</span>
                  <span className="text-xs text-zinc-500 ml-auto">
                    {new Date(player.next_match_date).toLocaleDateString('es-ES', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-zinc-400">
                  No hay partidos programados próximamente.
                </div>
              )}
            </div>

            {/* Loading State for Deep Analytics */}
            {loading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-4 w-32 bg-zinc-800 rounded"></div>
                <div className="h-32 bg-zinc-800 rounded-xl"></div>
              </div>
            ) : details ? (
              <div>
                <h3 className="text-sm font-bold text-zinc-300 uppercase mb-3">
                  Análisis Profundo
                </h3>
                <div className="bg-zinc-800/30 border border-zinc-800 p-4 rounded-xl text-sm text-zinc-400 leading-relaxed">
                  <p>
                    Total Puntos Temporada:{' '}
                    <strong className="text-white">{details.total_points}</strong>
                  </p>
                  <p>
                    Partidos Jugados: <strong className="text-white">{details.games_played}</strong>
                  </p>
                  {/* More detailed metrics from the player page could be mapped here */}
                  <div className="mt-4 pt-4 border-t border-zinc-800 flex justify-end">
                    <a
                      href={`/players/${player.player_id}`}
                      className="text-blue-400 hover:text-blue-300 font-medium flex items-center transition"
                    >
                      Ver Perfil Completo <TrendingUp size={14} className="ml-1" />
                    </a>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
