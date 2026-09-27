import type { ReactNode } from 'react';

export interface AppBackgroundProps {
  children?: ReactNode;
  className?: string;
  presentationMode?: 'desktop' | 'phone';
}

export function AppBackground({ children, className = '' }: AppBackgroundProps) {
  return (
    <div
      className={`relative isolate min-h-screen bg-[hsl(var(--surface-app))] text-[hsl(var(--content-primary))] ${className}`}
    >
      {/* Ambient subtle glow background - CSS semantic tokens ensure automatic dark/light compatibility */}
      <div className="pointer-events-none fixed inset-0 z-[-1] overflow-hidden" aria-hidden="true">
        <div
          className="absolute -top-[20%] right-[-10%] h-[50vw] w-[50vw] max-w-[650px] rounded-full blur-[140px]"
          style={{
            background: 'var(--effect-shell-ambient-primary)',
          }}
        />
        <div
          className="absolute top-[40%] -left-[10%] h-[40vw] w-[40vw] max-w-[500px] rounded-full blur-[120px]"
          style={{
            background: 'var(--effect-shell-ambient-subtle)',
          }}
        />
      </div>
      {children}
    </div>
  );
}
