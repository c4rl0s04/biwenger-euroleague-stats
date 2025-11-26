import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      {/* Hero Section */}
      <div className="text-center mb-16 space-y-4">
        <div className="inline-block">
          <h1 className="text-7xl font-bold bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 bg-clip-text text-transparent mb-2">
            BiwengerStats
          </h1>
          <div className="h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-600 rounded-full"></div>
        </div>
        <p className="text-slate-400 text-xl font-light">
          Tu dashboard de estadísticas de Euroliga
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4">
        
        {/* Market Card */}
        <Link href="/market" className="group">
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-amber-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-amber-500/20 overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500/0 via-amber-500/0 to-amber-500/0 group-hover:from-amber-500/5 group-hover:via-amber-500/10 group-hover:to-amber-500/5 transition-all duration-500"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Icon */}
              <div className="mb-6">
                <svg className="w-16 h-16 text-amber-400 transform group-hover:scale-110 transition-transform duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-amber-400 transition-colors duration-300">
                Market
              </h2>
              <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                Análisis de fichajes y tendencias del mercado
              </p>
              
              {/* Arrow */}
              <div className="mt-6 flex items-center text-slate-500 group-hover:text-amber-400 transition-all duration-300 group-hover:translate-x-2">
                <span className="text-sm font-medium">Explorar</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Porras Card */}
        <Link href="/porras" className="group">
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-purple-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/20 overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/5 group-hover:via-purple-500/10 group-hover:to-purple-500/5 transition-all duration-500"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500">
                🎱
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-purple-400 transition-colors duration-300">
                Porras
              </h2>
              <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                Estadísticas y rankings del juego de predicciones
              </p>
              
              {/* Arrow */}
              <div className="mt-6 flex items-center text-slate-500 group-hover:text-purple-400 transition-all duration-300 group-hover:translate-x-2">
                <span className="text-sm font-medium">Explorar</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </Link>

        {/* Usuarios Card */}
        <Link href="/usuarios" className="group">
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-slate-700/50 rounded-3xl p-8 hover:border-green-500/50 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/20 overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-green-500/0 to-green-500/0 group-hover:from-green-500/5 group-hover:via-green-500/10 group-hover:to-green-500/5 transition-all duration-500"></div>
            
            {/* Content */}
            <div className="relative z-10">
              <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-500">
                👥
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-green-400 transition-colors duration-300">
                Usuarios
              </h2>
              <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                Análisis detallado de plantillas y rendimiento
              </p>
              
              {/* Arrow */}
              <div className="mt-6 flex items-center text-slate-500 group-hover:text-green-400 transition-all duration-300 group-hover:translate-x-2">
                <span className="text-sm font-medium">Explorar</span>
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Subtle footer hint */}
      <div className="mt-20 text-center">
        <p className="text-slate-600 text-sm">
          Selecciona una sección para comenzar
        </p>
      </div>
    </div>
  );
}
