import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center">
      {/* Hero Section */}
      <div className="text-center mb-16 space-y-6">
        <div className="relative inline-block">
          <h1 className="relative text-7xl md:text-8xl font-black tracking-tight mb-4">
            <span className="block bg-gradient-to-r from-orange-500 via-red-500 to-orange-600 bg-clip-text text-transparent drop-shadow-2xl">
              Tu Liga
            </span>
            <span className="block text-5xl md:text-6xl bg-gradient-to-r from-red-400 via-orange-400 to-red-500 bg-clip-text text-transparent">
              Bajo el Microscopio
            </span>
          </h1>
        </div>
        
        <p className="text-slate-400 text-lg md:text-xl font-light max-w-2xl mx-auto">
          Estadísticas avanzadas · Análisis en tiempo real · Insights profesionales
        </p>
      </div>

      {/* Navigation Cards - 4 sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-7xl px-4">
        
        {/* Market Card - Orange/Yellow */}
        <Link href="/market" className="group">
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-2 border-slate-700/50 rounded-2xl p-6 hover:border-orange-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-orange-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/0 via-amber-500/0 to-orange-500/0 group-hover:from-orange-500/10 group-hover:via-amber-500/10 group-hover:to-orange-500/5 transition-all duration-500"></div>
            
            <div className="relative z-10">
              <div className="mb-4">
                <svg className="w-12 h-12 text-orange-400 transform group-hover:scale-110 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-orange-400 transition-colors duration-300">
                Market
              </h2>
              <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors duration-300">
                Fichajes y tendencias
              </p>
            </div>
          </div>
        </Link>

        {/* Porras Card - Purple */}
        <Link href="/porras" className="group">
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-2 border-slate-700/50 rounded-2xl p-6 hover:border-purple-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-purple-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/0 via-purple-500/0 to-purple-500/0 group-hover:from-purple-500/10 group-hover:via-purple-500/10 group-hover:to-purple-500/5 transition-all duration-500"></div>
            
            <div className="relative z-10">
              <div className="mb-4">
                <svg className="w-12 h-12 text-purple-400 transform group-hover:scale-110 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-purple-400 transition-colors duration-300">
                Porras
              </h2>
              <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors duration-300">
                Rankings y predicciones
              </p>
            </div>
          </div>
        </Link>

        {/* Usuarios Card - Blue */}
        <Link href="/usuarios" className="group">
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-2 border-slate-700/50 rounded-2xl p-6 hover:border-blue-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-blue-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/0 via-blue-500/0 to-blue-500/0 group-hover:from-blue-500/10 group-hover:via-blue-500/10 group-hover:to-blue-500/5 transition-all duration-500"></div>
            
            <div className="relative z-10">
              <div className="mb-4">
                <svg className="w-12 h-12 text-blue-400 transform group-hover:scale-110 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-400 transition-colors duration-300">
                Usuarios
              </h2>
              <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors duration-300">
                Plantillas y rendimiento
              </p>
            </div>
          </div>
        </Link>

        {/* Analytics Card - Green */}
        <Link href="/analytics" className="group">
          <div className="relative bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border-2 border-slate-700/50 rounded-2xl p-6 hover:border-green-500/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-green-500/30 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/0 via-green-500/0 to-green-500/0 group-hover:from-green-500/10 group-hover:via-green-500/10 group-hover:to-green-500/5 transition-all duration-500"></div>
            
            <div className="relative z-10">
              <div className="mb-4">
                <svg className="w-12 h-12 text-green-400 transform group-hover:scale-110 transition-all duration-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-green-400 transition-colors duration-300">
                Analytics
              </h2>
              <p className="text-slate-400 text-sm group-hover:text-slate-300 transition-colors duration-300">
                Datos avanzados
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
