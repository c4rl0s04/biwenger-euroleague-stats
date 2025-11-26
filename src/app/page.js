import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      {/* Hero Section */}
      <div className="text-center mb-16 space-y-6">
        <div className="relative inline-block">
          {/* Glowing effect behind title */}
          <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-orange-600 via-red-600 to-orange-600 animate-pulse"></div>
          
          <h1 className="relative text-8xl font-black tracking-tight mb-4">
            <span className="block bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent drop-shadow-2xl">
              BIWENGER
            </span>
            <span className="block text-6xl bg-gradient-to-r from-red-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
              ANALYTICS
            </span>
          </h1>
          
          {/* Underline effect */}
          <div className="h-2 bg-gradient-to-r from-transparent via-orange-500 to-transparent rounded-full opacity-60"></div>
        </div>
        
        <p className="text-slate-400 text-xl font-light max-w-2xl mx-auto">
          Análisis avanzado de tu liga de Euroliga · Estadísticas en tiempo real
        </p>
      </div>

      {/* Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl w-full px-4">
        
        {/* Market Card */}
        <Link href="/market" className="group">
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-2 border-slate-700/50 rounded-3xl p-8 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/30 overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-orange-500/0 to-red-500/0 group-hover:from-orange-500/10 group-hover:via-red-500/10 group-hover:to-orange-500/5 transition-all duration-500"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Icon */}
              <div className="mb-6">
                <svg className="w-16 h-16 text-orange-400 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors duration-300">
                Market
              </h2>
              <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                Análisis de fichajes y tendencias del mercado
              </p>
              
              {/* Arrow */}
              <div className="mt-6 flex items-center text-slate-500 group-hover:text-orange-400 transition-all duration-300 group-hover:translate-x-2">
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
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-2 border-slate-700/50 rounded-3xl p-8 hover:border-red-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-red-500/30 overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500/0 via-red-500/0 to-orange-500/0 group-hover:from-red-500/10 group-hover:via-orange-500/10 group-hover:to-red-500/5 transition-all duration-500"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Icon */}
              <div className="mb-6">
                <svg className="w-16 h-16 text-red-400 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-red-400 transition-colors duration-300">
                Porras
              </h2>
              <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                Estadísticas y rankings del juego de predicciones
              </p>
              
              {/* Arrow */}
              <div className="mt-6 flex items-center text-slate-500 group-hover:text-red-400 transition-all duration-300 group-hover:translate-x-2">
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
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-2 border-slate-700/50 rounded-3xl p-8 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/30 overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-red-500/0 to-orange-500/0 group-hover:from-orange-500/10 group-hover:via-red-500/10 group-hover:to-orange-500/5 transition-all duration-500"></div>
            
            {/* Content */}
            <div className="relative z-10">
              {/* Icon */}
              <div className="mb-6">
                <svg className="w-16 h-16 text-orange-400 transform group-hover:scale-110 group-hover:rotate-6 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-3xl font-bold text-white mb-3 group-hover:text-orange-400 transition-colors duration-300">
                Usuarios
              </h2>
              <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                Análisis detallado de plantillas y rendimiento
              </p>
              
              {/* Arrow */}
              <div className="mt-6 flex items-center text-slate-500 group-hover:text-orange-400 transition-all duration-300 group-hover:translate-x-2">
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
