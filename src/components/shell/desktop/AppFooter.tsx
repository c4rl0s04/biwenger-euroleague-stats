import { Github } from 'lucide-react';
import { NavigationLink } from '../shared/NavigationFeedback';

export interface AppFooterProps {
  className?: string;
}

export function AppFooter({ className = '' }: AppFooterProps) {
  return (
    <footer
      className={`border-t border-border/40 mt-auto bg-card/30 backdrop-blur-md relative overflow-hidden ${className}`}
    >
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 md:py-12">
        <div className="mb-8 grid grid-cols-1 gap-8 md:mb-10 md:grid-cols-4 md:gap-12">
          {/* Brand Section */}
          <div className="col-span-1 md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold font-sans tracking-tight text-foreground">
                Biwenger<span className="text-primary">Stats</span>
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm font-sans">
              El compañero analítico definitivo para mánagers de Biwenger Euroliga. Datos en tiempo
              real, métricas avanzadas y herramientas visuales.
            </p>
          </div>

          {/* Navigation Links */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-sans">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-sm font-medium text-muted-foreground">
              <li>
                <NavigationLink
                  href="/standings"
                  navigationLabel="Clasificación"
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                  Clasificación
                </NavigationLink>
              </li>
              <li>
                <NavigationLink
                  href="/schedule"
                  navigationLabel="Horario Jugadores"
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                  Horario Jugadores
                </NavigationLink>
              </li>
              <li>
                <NavigationLink
                  href="/market"
                  navigationLabel="Mercado"
                  className="hover:text-primary transition-colors flex items-center gap-2 group"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-primary/0 group-hover:bg-primary transition-colors" />
                  Mercado
                </NavigationLink>
              </li>
            </ul>
          </div>

          {/* Community & Version */}
          <div className="space-y-4">
            <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground font-sans">
              Proyecto
            </h4>
            <div className="flex items-center gap-3">
              <a
                href="https://github.com/c4rl0s04/AdvancedEuroleagueBiwengerStats"
                target="_blank"
                rel="noopener noreferrer"
                className="p-2.5 rounded-xl bg-secondary hover:bg-secondary/80 text-foreground transition-all hover:scale-105"
                aria-label="Repositorio de GitHub"
              >
                <Github className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded-md">
                v2.5.0 • Platinum
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/40 pt-6 text-center md:flex-row md:gap-6 md:pt-8 md:text-left">
          <p className="text-[11px] font-medium text-muted-foreground font-sans tracking-wide">
            © 2026 BiwengerStats. Built for the European Basketball Community.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default AppFooter;
