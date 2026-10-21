'use client';

import { cn } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';

// Map of standard color names to Tailwind text color classes
const COLUMN_COLOR_MAP = {
  blue: 'text-blue-400',
  yellow: 'text-yellow-400',
  emerald: 'text-emerald-400',
  green: 'text-emerald-400',
  pink: 'text-pink-400',
  cyan: 'text-cyan-400',
  orange: 'text-orange-400',
  purple: 'text-purple-400',
  red: 'text-red-400',
  amber: 'text-amber-400',
  indigo: 'text-indigo-400',
  teal: 'text-teal-400',
  lime: 'text-lime-400',
  fuchsia: 'text-fuchsia-400',
  primary: 'text-primary',
  rose: 'text-rose-400',
};

// --- Primitive Components (formerly BaseTable) ---

/**
 * Table - A primitive table component with project-standard styling.
 */
export function Table({ children, className, tableClassName }) {
  return (
    <div
      className={cn('overflow-x-auto rounded-xl', className)}
      tabIndex={0}
      role="region"
      aria-label="Tabla desplazable"
    >
      <table className={cn('w-full text-sm text-left border-collapse', tableClassName)}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className }) {
  return (
    <thead className={cn('bg-secondary/10 border-y border-border/20', className)}>{children}</thead>
  );
}

export function TableHeaderCell({
  children,
  className,
  align = 'center',
  color,
  colSpan,
  onClick,
}) {
  const colorClass = color ? COLUMN_COLOR_MAP[color] || color : '';

  return (
    <th
      colSpan={colSpan}
      onClick={onClick}
      className={cn(
        'px-2 md:px-4 py-3 bg-white/[0.01] transition-colors text-foreground/80 font-bold text-[10px] md:text-sm uppercase tracking-widest font-sans border-b border-border/20',
        align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center',
        colorClass,
        className
      )}
    >
      {children}
    </th>
  );
}

export function TableRow({ children, className, hovering = true }) {
  return (
    <tr
      className={cn('transition-colors group', hovering ? 'hover:bg-secondary/20' : '', className)}
    >
      {children}
    </tr>
  );
}

export function TableCell({ children, className, align = 'center', color, colSpan }) {
  const colorClass = color ? COLUMN_COLOR_MAP[color] || color : '';

  return (
    <td
      colSpan={colSpan}
      className={cn(
        'px-2 md:px-4 py-2 border-b border-border/20 text-sm md:text-base font-medium',
        align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center',
        colorClass,
        className
      )}
    >
      {children}
    </td>
  );
}

/**
 * TableIdentity - A component for displaying an entity's identity (avatar + name + optional subtitle).
 * Used for both Managers and Teams.
 */
export function TableIdentity({
  name,
  image,
  subtitle,
  link,
  color,
  size = 'md',
  className,
  imageClassName,
  nameClassName,
}) {
  const isSm = size === 'sm';

  const content = (
    <div
      className={cn(
        'flex items-center gap-2 md:gap-3 p-0.5 rounded-xl transition-all group/link',
        className
      )}
    >
      <div
        className={cn(
          'relative shrink-0 overflow-hidden rounded-full border border-white/5 shadow-md',
          isSm ? 'w-7 h-7 md:w-8 md:h-8' : 'w-9 h-9 md:w-10 md:h-10'
        )}
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className={cn(
              'object-cover object-top scale-125 transition-transform duration-500 group-hover/link:scale-150 origin-top',
              imageClassName
            )}
            sizes={isSm ? '32px' : '40px'}
          />
        ) : (
          <div
            className={cn(
              'w-full h-full bg-slate-800 flex items-center justify-center font-black text-white',
              isSm ? 'text-xs' : 'text-sm md:text-base'
            )}
          >
            {name.charAt(0)}
          </div>
        )}
      </div>
      <div className="flex flex-col min-w-0 text-left">
        <span
          className={cn(
            'font-bold transition-all group-hover/link:scale-105 origin-left tracking-tight whitespace-nowrap',
            isSm ? 'text-sm md:text-base' : 'text-base md:text-lg',
            color,
            nameClassName
          )}
        >
          {name}
        </span>
        {subtitle && (
          <span className="text-muted-foreground truncate text-sm font-medium">{subtitle}</span>
        )}
      </div>
    </div>
  );

  if (link) {
    return (
      <Link href={link} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
