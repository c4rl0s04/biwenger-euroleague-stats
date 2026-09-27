import type { ReactNode } from 'react';
import { AppMain } from '../shared/AppMain';
import { MobileNavigation } from './MobileNavigation';

export interface MobileShellProps {
  children: ReactNode;
}

export function MobileShell({ children }: MobileShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppMain>{children}</AppMain>
      <MobileNavigation />
    </div>
  );
}

export default MobileShell;
