import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { ArrowLeft, ArrowRight, Search } from 'lucide-react';

import MobileHeaderActions from './MobileHeaderActions';

type IconComponent = ComponentType<{
  size?: number;
  strokeWidth?: number;
  className?: string;
  'aria-hidden'?: boolean | 'true' | 'false';
}>;

interface MobileScreenProps {
  children: ReactNode;
  className?: string;
  labelledBy?: string;
}

export function MobileScreen({ children, className = '', labelledBy }: MobileScreenProps) {
  return (
    <div className={`mobile-native-screen ${className}`} aria-labelledby={labelledBy}>
      {children}
    </div>
  );
}

interface MobileScreenHeaderProps {
  title: string;
  eyebrow?: string;
  description?: string;
  showSearch?: boolean;
  action?: ReactNode;
}

export function MobileScreenHeader({
  title,
  eyebrow,
  description,
  showSearch = true,
  action,
}: MobileScreenHeaderProps) {
  return (
    <header className="mobile-native-header">
      <div className="mobile-native-header-copy">
        {eyebrow && <p className="mobile-native-eyebrow">{eyebrow}</p>}
        <h1 id="mobile-screen-title" className="mobile-native-title">
          {title}
        </h1>
        {description && <p className="mobile-native-description">{description}</p>}
      </div>
      {action ?? (showSearch ? <MobileHeaderActions /> : null)}
    </header>
  );
}

interface MobileBackHeaderProps {
  title: string;
  backHref: string;
  context?: string;
  action?: ReactNode;
}

export function MobileBackHeader({ title, backHref, context, action }: MobileBackHeaderProps) {
  return (
    <header className="mobile-native-back-header">
      <Link href={backHref} className="mobile-native-icon-button" aria-label={`Volver a ${context ?? 'la pantalla anterior'}`}>
        <ArrowLeft size={21} aria-hidden="true" />
      </Link>
      <div className="min-w-0 flex-1">
        {context && <p className="mobile-native-back-context">{context}</p>}
        <h1 id="mobile-screen-title" className="mobile-native-back-title">
          {title}
        </h1>
      </div>
      {action}
    </header>
  );
}

export function MobileMetricGrid({ children }: { children: ReactNode }) {
  return <div className="mobile-metric-grid">{children}</div>;
}

interface MobileMetricProps {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  tone?: 'default' | 'accent' | 'positive' | 'negative';
}

export function MobileMetric({ label, value, detail, tone = 'default' }: MobileMetricProps) {
  return (
    <div className={`mobile-metric mobile-metric-${tone}`}>
      <span className="mobile-metric-label">{label}</span>
      <strong className="mobile-metric-value">{value}</strong>
      {detail && <span className="mobile-metric-detail">{detail}</span>}
    </div>
  );
}

interface MobileSectionLinkProps {
  href: string;
  title: string;
  description?: string;
  meta?: ReactNode;
  icon: IconComponent;
  accent?: 'orange' | 'green' | 'blue' | 'red' | 'violet';
}

export function MobileSectionLink({
  href,
  title,
  description,
  meta,
  icon: Icon,
  accent = 'orange',
}: MobileSectionLinkProps) {
  return (
    <Link href={href} prefetch className="mobile-section-link">
      <span className={`mobile-section-icon mobile-section-icon-${accent}`}>
        <Icon size={20} strokeWidth={2.2} aria-hidden="true" />
      </span>
      <span className="mobile-section-copy">
        <span className="mobile-section-title">{title}</span>
        {description && <span className="mobile-section-description">{description}</span>}
      </span>
      {meta && <span className="mobile-section-meta">{meta}</span>}
      <ArrowRight className="mobile-section-arrow" size={18} aria-hidden="true" />
    </Link>
  );
}

interface MobileListRowProps {
  title: ReactNode;
  subtitle?: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  href?: string;
}

export function MobileListRow({ title, subtitle, leading, trailing, href }: MobileListRowProps) {
  const content = (
    <>
      {leading && <span className="mobile-list-leading">{leading}</span>}
      <span className="mobile-list-copy">
        <span className="mobile-list-title">{title}</span>
        {subtitle && <span className="mobile-list-subtitle">{subtitle}</span>}
      </span>
      {trailing && <span className="mobile-list-trailing">{trailing}</span>}
      {href && <ArrowRight size={17} className="mobile-list-arrow" aria-hidden="true" />}
    </>
  );

  return href ? (
    <Link href={href} prefetch className="mobile-list-row">
      {content}
    </Link>
  ) : (
    <div className="mobile-list-row">{content}</div>
  );
}

interface MobileActionTileProps {
  href: string;
  title: string;
  description: string;
  icon: IconComponent;
  featured?: boolean;
}

export function MobileActionTile({
  href,
  title,
  description,
  icon: Icon,
  featured = false,
}: MobileActionTileProps) {
  return (
    <Link href={href} prefetch className={`mobile-action-tile ${featured ? 'mobile-action-tile-featured' : ''}`}>
      <span className="mobile-action-tile-icon">
        <Icon size={23} strokeWidth={2.1} aria-hidden="true" />
      </span>
      <span className="mobile-action-tile-title">{title}</span>
      <span className="mobile-action-tile-description">{description}</span>
      <ArrowRight size={17} className="mobile-action-tile-arrow" aria-hidden="true" />
    </Link>
  );
}

export function MobileSectionHeading({
  children,
  action,
}: {
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mobile-section-heading">
      <h2>{children}</h2>
      {action}
    </div>
  );
}

export function MobileSearchLink() {
  return (
    <Link href="/?search=open" className="mobile-native-icon-button" aria-label="Buscar">
      <Search size={20} aria-hidden="true" />
    </Link>
  );
}
