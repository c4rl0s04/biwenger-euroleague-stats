import { Download, Link2, LockKeyhole, MoonStar } from 'lucide-react';

import {
  MobileScreen,
  MobileScreenHeader,
  MobileSectionHeading,
  MobileSectionLink,
} from '../MobileScreen';

interface MobileSettingsScreenProps {
  biwengerLinked: boolean;
}

export default function MobileSettingsScreen({ biwengerLinked }: MobileSettingsScreenProps) {
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader
        eyebrow="Cuenta"
        title="Ajustes"
        description="Seguridad, conexión y experiencia de la aplicación"
      />

      <MobileSectionHeading>Tu cuenta</MobileSectionHeading>
      <div className="mobile-section-list">
        <MobileSectionLink
          href="/settings/account"
          title="Cuenta y seguridad"
          description="Cambia tu contraseña de acceso"
          icon={LockKeyhole}
        />
        <MobileSectionLink
          href="/settings/biwenger"
          title="Conexión con Biwenger"
          description="Actualiza las credenciales de sincronización"
          meta={biwengerLinked ? 'Vinculada' : 'Pendiente'}
          icon={Link2}
          accent={biwengerLinked ? 'green' : 'orange'}
        />
      </div>

      <MobileSectionHeading>Aplicación</MobileSectionHeading>
      <div className="mobile-section-list">
        <MobileSectionLink
          href="/settings/appearance"
          title="Apariencia"
          description="Tema y efectos visuales"
          icon={MoonStar}
          accent="violet"
        />
        <MobileSectionLink
          href="/settings/install"
          title="Instalación"
          description="Estado de la PWA e instrucciones"
          icon={Download}
          accent="blue"
        />
      </div>
    </MobileScreen>
  );
}
