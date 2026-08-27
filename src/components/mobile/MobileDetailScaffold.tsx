import type { ReactNode } from 'react';

import { MobileBackHeader, MobileScreen } from './MobileScreen';

interface MobileDetailScaffoldProps {
  title: string;
  context: string;
  backHref: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export default function MobileDetailScaffold({
  title,
  context,
  backHref,
  description,
  action,
  children,
}: MobileDetailScaffoldProps) {
  return (
    <MobileScreen labelledBy="mobile-screen-title">
      <MobileBackHeader title={title} context={context} backHref={backHref} action={action} />
      {description && <p className="mobile-detail-intro">{description}</p>}
      {children}
    </MobileScreen>
  );
}
