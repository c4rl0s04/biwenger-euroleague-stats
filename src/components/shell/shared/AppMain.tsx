import type { ReactNode } from 'react';

export interface AppMainProps {
  children: ReactNode;
  className?: string;
}

export function AppMain({ children, className = '' }: AppMainProps) {
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className={`flex-grow w-full app-main-content focus:outline-none ${className}`}
    >
      {children}
    </main>
  );
}
