import {
  Bot,
  CalendarDays,
  Clock3,
  FlaskConical,
  LayoutDashboard,
  LayoutGrid,
  Medal,
  Scale,
  ShoppingCart,
  Sparkles,
  Target,
  Trophy,
  UserRoundSearch,
  Users,
} from 'lucide-react';

import {
  MobileActionTile,
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '../MobileScreen';
import MobileNewsStrip from '../MobileNewsStrip';

interface HomeNewsItem {
  id: string;
  title: string;
  description?: string;
}

export default function MobileHomeScreen({ news = [] }: { news?: HomeNewsItem[] }) {
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader
        eyebrow="BiwengerStats"
        title="Inicio"
        description="Todo tu juego, a dos pulsaciones"
      />

      <MobileNewsStrip items={news} />

      <MobileSectionHeading>Tu día</MobileSectionHeading>
      <div className="mobile-action-grid">
        <MobileActionTile
          href="/dashboard"
          title="Dashboard"
          description="Tu posición, alertas y próxima jornada"
          icon={LayoutDashboard}
          featured
        />
        <MobileActionTile
          href="/schedule"
          title="Horario"
          description="Cuándo juega cada miembro de tu plantilla"
          icon={Clock3}
          featured
        />
        <MobileActionTile
          href="/lineup"
          title="Alineación"
          description="Quinteto, capitán y banquillo"
          icon={Sparkles}
        />
        <MobileActionTile
          href="/market"
          title="Mercado"
          description="Jugadores libres y movimientos recientes"
          icon={ShoppingCart}
        />
      </div>

      <MobileSectionHeading>Liga</MobileSectionHeading>
      <div>
        <MobileSectionLink href="/standings" title="Clasificación" description="Tabla y pulso de la liga" icon={Trophy} />
        <MobileSectionLink href="/players" title="Jugadores" description="Buscar, filtrar y comparar rendimiento" icon={UserRoundSearch} accent="blue" />
        <MobileSectionLink href="/matches" title="Partidos" description="Calendario y resultados" icon={CalendarDays} accent="red" />
        <MobileSectionLink href="/rounds" title="Jornadas" description="Alineaciones y estadísticas por jornada" icon={Users} accent="green" />
        <MobileSectionLink href="/compare" title="Comparativa" description="Cara a cara entre mánagers" icon={Scale} accent="violet" />
      </div>

      <MobileSectionHeading>Competición</MobileSectionHeading>
      <div>
        <MobileSectionLink href="/tournaments" title="Torneos" description="Copas, eliminatorias e historial" icon={Medal} />
        <MobileSectionLink href="/predictions" title="Porras" description="Predicciones, ranking y logros" icon={Target} accent="green" />
      </div>

      <MobileSectionHeading>Herramientas</MobileSectionHeading>
      <div>
        <MobileSectionLink href="/assistant" title="Asistente" description="Consulta tus datos en lenguaje natural" icon={Bot} accent="violet" />
        <MobileSectionLink href="/hoopgrid" title="Hoopgrid" description="El reto diario 3 × 3" icon={LayoutGrid} accent="blue" />
        <MobileSectionLink href="/season-review" title="Análisis 25/26" description="Equilibrio, límites y simulaciones" icon={FlaskConical} />
      </div>
    </MobileScreen>
  );
}
