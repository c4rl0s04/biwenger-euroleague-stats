import Image from 'next/image';
import { NavigationLink } from './NavigationFeedback';

export interface AppBrandProps {
  className?: string;
  showWordmark?: boolean;
}

export function AppBrand({ className = '', showWordmark = true }: AppBrandProps) {
  return (
    <NavigationLink
      href="/"
      navigationLabel="Inicio"
      className={`flex items-center gap-2 group ${className}`}
      aria-label="BiwengerStats - Ir al inicio"
    >
      <div className="relative w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 transition-transform group-hover:scale-105 duration-500 shrink-0">
        <Image
          src="/brand-logo.png"
          alt="BiwengerStats"
          fill
          priority
          unoptimized
          className="object-contain drop-shadow-[0_0_12px_hsla(19,99%,49%,0.4)]"
          sizes="56px"
        />
      </div>
      {showWordmark && (
        <span className="hidden sm:block text-lg lg:text-xl font-bold font-sans tracking-tight text-foreground">
          Biwenger
          <span className="text-primary group-hover:text-primary/90 transition-colors">Stats</span>
        </span>
      )}
    </NavigationLink>
  );
}
