import Link from 'next/link';
import { getMarketKPIs, getPorrasStats, getSquadStats } from '@/lib/database';

export default function Home() {
  // Fetch data on the server
  let marketKPIs, porrasStats, squadStats;
  
  try {
    marketKPIs = getMarketKPIs();
    porrasStats = getPorrasStats();
    squadStats = getSquadStats();
  } catch (error) {
    console.error('Error loading data:', error);
    marketKPIs = { total_transfers: 0, active_users: 0 };
    porrasStats = [];
    squadStats = [];
  }
  
  // Get top performer
  const topPorrasPlayer = porrasStats[0];
  const topSquad = squadStats[0];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-2">
          🏀 Dashboard de Estadísticas
        </h1>
        <p className="text-slate-400">
          Tu liga de Biwenger en tiempo real
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <QuickStat
          label="Total Fichajes"
          value={marketKPIs.total_transfers || 0}
          icon="💰"
          color="amber"
        />
        <QuickStat
          label="Valor Medio"
          value={`${(marketKPIs.avg_value || 0).toLocaleString('es-ES')}€`}
          icon="📊"
          color="blue"
        />
        <QuickStat
          label="Líder Porras"
          value={topPorrasPlayer?.usuario || 'N/A'}
          icon="🏆"
          color="green"
        />
      </div>

      {/* Main Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Market Card */}
        <Link
          href="/market"
          className="block group"
        >
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-amber-500 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">💰 Market</h2>
              <svg className="w-6 h-6 text-slate-400 group-hover:text-amber-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-slate-400 mb-4">
              Análisis completo del mercado de fichajes
            </p>
            <div className="space-y-2">
              <StatRow label="Total Transferencias" value={marketKPIs.total_transfers || 0} />
              <StatRow label="Valor Promedio" value={`${(marketKPIs.avg_value || 0).toLocaleString('es-ES')}€`} />
              <StatRow label="Fichaje Récord" value={`${(marketKPIs.max_value || 0).toLocaleString('es-ES')}€`} />
            </div>
          </div>
        </Link>

        {/* Porras Card */}
        <Link
          href="/porras"
          className="block group"
        >
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-purple-500 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">🎱 Porras</h2>
              <svg className="w-6 h-6 text-slate-400 group-hover:text-purple-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-slate-400 mb-4">
              Estadísticas del juego de predicciones
            </p>
            <div className="space-y-2">
              <StatRow label="Líder" value={topPorrasPlayer?.usuario || 'N/A'} />
              <StatRow label="Total Aciertos" value={topPorrasPlayer?.total_hits || 0} />
              <StatRow label="Media" value={topPorrasPlayer?.avg_hits?.toFixed(1) || '0.0'} />
            </div>
          </div>
        </Link>

        {/* Usuarios Card */}
        <Link
          href="/usuarios"
          className="block group"
        >
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-green-500 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">👥 Usuarios</h2>
              <svg className="w-6 h-6 text-slate-400 group-hover:text-green-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-slate-400 mb-4">
              Análisis detallado de plantillas
            </p>
            <div className="space-y-2">
              <StatRow label="Mejor Plantilla" value={topSquad?.user_id || 'N/A'} />
              <StatRow label="Puntos Totales" value={topSquad?.total_points || 0} />
              <StatRow label="Valor Total" value={`${(topSquad?.total_value || 0).toLocaleString('es-ES')}€`} />
            </div>
          </div>
        </Link>

        {/* Analytics Card */}
        <Link
          href="/analytics"
          className="block group"
        >
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 hover:border-blue-500 transition-all hover:scale-[1.02]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-white">📊 Analytics</h2>
              <svg className="w-6 h-6 text-slate-400 group-hover:text-blue-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
            <p className="text-slate-400 mb-4">
              Estadísticas avanzadas y tendencias
            </p>
            <div className="space-y-2">
              <StatRow label="Total Usuarios" value={squadStats.length} />
              <StatRow label="Jornadas Jugadas" value="En desarrollo" />
              <StatRow label="Datos Disponibles" value="Completos" />
            </div>
          </div>
        </Link>
      </div>

      {/* Info Note */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
        <div className="flex items-start">
          <span className="text-blue-400 text-2xl mr-3">ℹ️</span>
          <div>
            <h3 className="text-blue-300 font-semibold mb-1">
              ¡Bienvenido a la nueva versión con Next.js!
            </h3>
            <p className="text-blue-200 text-sm">
              Este es tu nuevo dashboard construido con React y Next.js. 
              Las páginas se irán migrando progresivamente desde la versión Flask.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickStat({ label, value, icon, color }) {
  const colors = {
    amber: 'border-amber-500/20 bg-amber-500/5',
    blue: 'border-blue-500/20 bg-blue-500/5',
    green: 'border-green-500/20 bg-green-500/5',
  };

  return (
    <div className={`${colors[color]} border rounded-lg p-4`}>
      <div className="text-3xl mb-2">{icon}</div>
      <div className="text-slate-400 text-sm">{label}</div>
      <div className="text-white text-2xl font-bold">{value}</div>
    </div>
  );
}

function StatRow({ label, value }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-slate-400">{label}:</span>
      <span className="text-white font-semibold">{value}</span>
    </div>
  );
}
