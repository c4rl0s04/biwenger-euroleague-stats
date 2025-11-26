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
        <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              {/* Logo with Basketball Icon */}
              <a href="/" className="flex items-center gap-3 group">
                {/* Basketball SVG Icon */}
                <div className="relative">
                  <svg className="w-10 h-10 text-orange-500 group-hover:text-orange-400 transition-all duration-300 group-hover:rotate-[360deg]" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.2"/>
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                    <path d="M12 6v12M6 12h12M8.5 8.5l7 7M8.5 15.5l7-7" stroke="currentColor" strokeWidth="0.5" fill="none"/>
                  </svg>
                  {/* Glow effect */}
                  <div className="absolute inset-0 blur-xl bg-orange-500/30 group-hover:bg-orange-500/50 transition-all duration-300"></div>
                </div>
                
                {/* Brand Name */}
                <div className="flex flex-col">
                  <span className="text-xl font-black tracking-tight bg-gradient-to-r from-orange-400 via-red-400 to-orange-500 bg-clip-text text-transparent">
                    BIWENGER
                  </span>
                  <span className="text-xs font-semibold text-slate-400 -mt-1">
                    ANALYTICS
                  </span>
                </div>
              </a>

              {/* Navigation Links */}
              <nav className="hidden md:flex items-center gap-1">
                <NavLink href="/market" color="orange">Market</NavLink>
                <NavLink href="/porras" color="purple">Porras</NavLink>
                <NavLink href="/usuarios" color="blue">Usuarios</NavLink>
                <NavLink href="/analytics" color="green">Analytics</NavLink>
              </nav>

              {/* Mobile Menu Button */}
              <button className="md:hidden p-2 text-slate-400 hover:text-white transition-colors">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800 mt-20">
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

// NavLink Component
function NavLink({ href, children, color }) {
  const colors = {
    orange: 'hover:text-orange-400 hover:bg-orange-500/10',
    purple: 'hover:text-purple-400 hover:bg-purple-500/10',
    blue: 'hover:text-blue-400 hover:bg-blue-500/10',
    green: 'hover:text-green-400 hover:bg-green-500/10',
  };
  
  return (
    <a 
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium text-slate-400 transition-all duration-200 ${colors[color]}`}
    >
      {children}
    </a>
  );
}
