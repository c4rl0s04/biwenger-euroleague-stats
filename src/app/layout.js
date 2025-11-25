import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "BiwengerStats Dashboard",
  description: "Advanced statistics and analytics for your Biwenger basketball league",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <div className="min-h-screen bg-slate-900">
          {/* Navigation */}
          <nav className="bg-slate-800 border-b border-slate-700">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center space-x-8">
                  <Link href="/" className="flex items-center">
                    <span className="text-2xl font-bold text-green-500">🏀</span>
                    <span className="ml-2 text-xl font-bold text-white">BiwengerStats</span>
                  </Link>
                  
                  <div className="hidden md:flex space-x-4">
                    <NavLink href="/">Home</NavLink>
                    <NavLink href="/market">Market</NavLink>
                    <NavLink href="/porras">Porras</NavLink>
                    <NavLink href="/usuarios">Usuarios</NavLink>
                    <NavLink href="/analytics">Analytics</NavLink>
                  </div>
                </div>
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>

          {/* Footer */}
          <footer className="border-t border-slate-800 bg-slate-900 py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 text-center">
              <p className="text-slate-500 text-sm">
                BiwengerStats Dashboard © 2025
              </p>
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}

function NavLink({ href, children }) {
  return (
    <Link
      href={href}
      className="text-slate-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
    >
      {children}
    </Link>
  );
}
