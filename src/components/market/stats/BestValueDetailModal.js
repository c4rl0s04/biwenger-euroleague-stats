'use client';

import { X, Trophy } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function BestValueDetailModal({ transferId, isOpen, onClose }) {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    if (isOpen && transferId) {
      setLoading(true); // eslint-disable-line react-hooks/set-state-in-effect
      fetch(`/api/market/stats/value-details?transferId=${transferId}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setMatches(data);
          } else {
            console.error('Invalid data format', data);
            setMatches([]);
          }
          setLoading(false);
        })
        .catch((err) => {
          console.error(err);
          setMatches([]);
          setLoading(false);
        });
    }
  }, [isOpen, transferId]);

  if (!isOpen) return null;

  const totalPoints = matches.reduce((sum, m) => sum + m.points, 0);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-sm overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-800 bg-zinc-900/50">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Trophy size={14} className="text-amber-500" />
            Puntos Durante Propiedad
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-zinc-800 rounded-full transition-colors text-zinc-400"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content - Compact Table */}
        <div className="max-h-[50vh] overflow-y-auto">
          {loading ? (
            <div className="p-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 bg-zinc-800/50 rounded animate-pulse" />
              ))}
            </div>
          ) : matches.length === 0 ? (
            <div className="text-center text-zinc-500 py-6 text-sm">
              No hay partidos registrados.
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead className="bg-zinc-800/50 text-zinc-500 uppercase sticky top-0">
                <tr>
                  <th className="text-left px-3 py-1.5 font-semibold">Jornada</th>
                  <th className="text-left px-2 py-1.5 font-semibold">vs</th>
                  <th className="text-right px-3 py-1.5 font-semibold">Pts</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {matches.map((match, idx) => (
                  <tr key={idx} className="hover:bg-zinc-800/30">
                    <td className="px-3 py-1.5 text-zinc-400">
                      {match.round_name?.replace('Jornada ', 'J')}
                    </td>
                    <td className="px-2 py-1.5 text-zinc-300 truncate max-w-[120px]">
                      {match.opponent}
                    </td>
                    <td
                      className={`px-3 py-1.5 text-right font-bold ${match.points > 10 ? 'text-amber-500' : match.points > 0 ? 'text-white' : 'text-zinc-500'}`}
                    >
                      {match.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="px-3 py-2 bg-zinc-800/50 border-t border-zinc-800 flex justify-between items-center">
          <span className="text-xs text-zinc-400">{matches.length} partidos</span>
          <span className="text-sm font-black text-amber-500">{totalPoints} pts</span>
        </div>
      </div>
    </div>
  );
}
