import type { ReactNode } from 'react';
import { NavigationFeedbackProvider } from './shared/NavigationFeedback';
import { AppBackground } from './shared/AppBackground';
import { DesktopShell } from './desktop/DesktopShell';
import { MobileShell } from './mobile/MobileShell';

export interface AppShellProps {
  children: ReactNode;
  presentationMode?: 'desktop' | 'phone';
}

export function AppShell({ children, presentationMode = 'desktop' }: AppShellProps) {
  const isPhone = presentationMode === 'phone';

  return (
    <NavigationFeedbackProvider>
      <div
        className={`${isPhone ? 'mobile-app' : ''} min-h-screen flex flex-col`}
        data-presentation={presentationMode}
      >
        <a href="#main-content" className="skip-link">
          Saltar al contenido
        </a>
        <AppBackground presentationMode={presentationMode}>
          {isPhone ? (
            <MobileShell>{children}</MobileShell>
          ) : (
            <DesktopShell>{children}</DesktopShell>
          )}
        </AppBackground>
      </div>
    </NavigationFeedbackProvider>
  );
}

export default AppShell;
