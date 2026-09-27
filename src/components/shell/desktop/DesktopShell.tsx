import type { ReactNode } from 'react';
import { NewsTicker } from '@/features/news/public';
import { AppHeader } from './AppHeader';
import { Sidebar } from './Sidebar';
import { AppFooter } from './AppFooter';
import { AppMain } from '../shared/AppMain';

export interface DesktopShellProps {
  children: ReactNode;
}

export function DesktopShell({ children }: DesktopShellProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <AppHeader />
      <div className="flex flex-1">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
          <NewsTicker />
          <AppMain>{children}</AppMain>
          <AppFooter />
        </div>
      </div>
    </div>
  );
}

export default DesktopShell;
