import MobileDetailScaffold from '@/components/mobile/MobileDetailScaffold';
import { MobileSectionHeading, MobileListRow } from '@/components/mobile/MobileScreen';
import type { ManagerProfileSection } from '../models/manager-profile';

export default function ManagerProfileSectionScreen({
  title,
  backHref,
  data,
}: {
  title: string;
  backHref: string;
  data: ManagerProfileSection;
}) {
  return (
    <MobileDetailScaffold title={title} context={data.context} backHref={backHref}>
      <MobileSectionHeading>Detalle</MobileSectionHeading>
      {!data.rows.length ? (
        <p className="mobile-record-empty">No hay datos disponibles para esta vista.</p>
      ) : (
        <div>
          {data.rows.map((row) => (
            <MobileListRow
              key={row.key}
              href={row.href}
              leading={<span className="mobile-record-index">{row.index}</span>}
              title={row.title}
              subtitle={row.subtitle}
              trailing={row.value}
            />
          ))}
        </div>
      )}
    </MobileDetailScaffold>
  );
}
