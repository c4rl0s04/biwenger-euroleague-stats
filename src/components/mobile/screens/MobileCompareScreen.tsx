import { Scale } from 'lucide-react';

import { MobileListRow, MobileScreen, MobileScreenHeader, MobileSectionHeading } from '../MobileScreen';

type RecordValue = Record<string, any>;

export default function MobileCompareScreen({ users, currentUserId }: { users: RecordValue[]; currentUserId?: string | number }) {
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileScreenHeader eyebrow="Cara a cara" title="Comparativa" description="Elige un rival para abrir el enfrentamiento" />
      <div className="mobile-compare-hero"><Scale size={28} aria-hidden="true" /><div><strong>Tu temporada contra la suya</strong><span>Puntos, regularidad, plantilla y decisiones</span></div></div>
      <MobileSectionHeading>Seleccionar rival</MobileSectionHeading>
      <div>{users.filter((user) => String(user.id) !== String(currentUserId)).map((user) => <MobileListRow key={String(user.id)} href={`/compare/${user.id}`} leading={<span className="mobile-profile-badge mobile-compare-avatar">{String(user.name).slice(0, 2)}</span>} title={user.name} subtitle="Abrir comparación completa" trailing="VS" />)}</div>
    </MobileScreen>
  );
}
