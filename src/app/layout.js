import './globals.css'

export const metadata = {
  title: 'BiwengerStats',
  description: 'Análisis avanzado de tu liga de Euroliga',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        {/* Modern Header */}
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/60">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo with Basketball Icon */}
              <a href="/" className="flex items-center gap-3 group">
                {/* Basketball SVG Icon */}
                <div className="relative">
                  <svg className="w-10 h-10 text-orange-500 group-hover:text-orange-400 transition-all duration-500 group-hover:rotate-[360deg] filter drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    <path d="M12 6v12M6 12h12M8.5 8.5l7 7M8.5 15.5l7-7" stroke="currentColor" strokeWidth="0.5" fill="none"/>
                  </svg>
                </div>
                
                {/* Brand Name */}
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tight bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 bg-clip-text text-transparent">
                    BIWENGER
                  </span>
                  <span className="text-xs font-semibold text-slate-400 -mt-1 tracking-widest">
                    ANALYTICS
                  </span>
                </div>
              </a>

              {/* Navigation Links - Pill Buttons */}
              <nav className="hidden md:flex items-center gap-2">
                <NavLink href="/market" color="orange" icon="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6">Market</NavLink>
                <NavLink href="/porras" color="purple" icon="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z">Porras</NavLink>
                <NavLink href="/usuarios" color="blue" icon="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z">Usuarios</NavLink>
                <NavLink href="/analytics" color="green" icon="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z">Analytics</NavLink>
              </nav>

              {/* Mobile Menu Button */}
              <button className="md:hidden p-2 text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Soft Gradient Separator */}
          <div className="absolute bottom-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-slate-700/50 to-transparent"></div>
        </header>

        {/* Main Content */}
        <main className="flex-grow max-w-7xl mx-auto px-6 py-8 w-full">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/50 mt-auto bg-slate-950/30 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-6 py-8">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <p className="text-slate-500 text-sm">
                © 2025 BiwengerStats. Análisis avanzado de Euroliga.
              </p>
              <div className="flex items-center gap-4 text-sm text-slate-400">
                <span>Creado por Carlos Andrés Huete</span>
              </div>
            </div>
          </div>
        </footer>
      </body>
    </html>
  )
}

// NavLink Component with Glow Effect
function NavLink({ href, children, color, icon }) {
  const colors = {
    orange: 'hover:border-orange-500/50 hover:bg-orange-500/10 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(249,115,22,0.3)]',
    purple: 'hover:border-purple-500/50 hover:bg-purple-500/10 hover:text-purple-400 hover:shadow-[0_0_15px_rgba(147,51,234,0.3)]',
    blue: 'hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400 hover:shadow-[0_0_15px_rgba(59,130,246,0.3)]',
    green: 'hover:border-green-500/50 hover:bg-green-500/10 hover:text-green-400 hover:shadow-[0_0_15px_rgba(34,197,94,0.3)]',
  };
  
  return (
    <a 
      href={href}
      className={`
        relative px-4 py-2 rounded-full text-sm font-medium text-slate-400 
        border border-transparent transition-all duration-300
        flex items-center gap-2 group
        ${colors[color]}
      `}
    >
      {/* Icon */}
      <svg className="w-4 h-4 opacity-70 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
      </svg>
      {children}
    </a>
  );
}
