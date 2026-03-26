'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getColorForUser } from '@/lib/constants/colors';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
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
};

// --- Primitive Components (formerly BaseTable) ---

/**
 * Table - A primitive table component with project-standard styling.
 */
export function Table({ children, className }) {
  return (
    <div className={cn('overflow-x-auto rounded-xl overflow-hidden', className)}>
      <table className="w-full text-sm text-left border-collapse">{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }) {
  return <thead className={cn('bg-white/5 border-y border-white/5', className)}>{children}</thead>;
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
        'px-4 py-3 bg-white/[0.02] transition-colors text-slate-200 font-bold text-xs md:text-sm uppercase tracking-widest font-sans border-b border-white/5',
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
      className={cn('transition-colors group', hovering ? 'hover:bg-white/[0.03]' : '', className)}
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
        'px-4 py-2 border-b border-white/5 text-sm md:text-base font-medium',
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
export function TableIdentity({ name, image, subtitle, link, color, size = 'md', className }) {
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
          'relative shrink-0',
          isSm ? 'w-7 h-7 md:w-8 md:h-8' : 'w-9 h-9 md:w-10 md:h-10'
        )}
      >
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            className="rounded-full object-cover border border-white/5 shadow-md"
            sizes={isSm ? '32px' : '40px'}
          />
        ) : (
          <div
            className={cn(
              'rounded-full bg-slate-800 flex items-center justify-center font-black text-white shadow-md border border-white/5',
              isSm
                ? 'w-7 h-7 md:w-8 md:h-8 text-xs'
                : 'w-9 h-9 md:w-10 md:h-10 text-sm md:text-base'
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
            color
          )}
        >
          {name}
        </span>
        {subtitle && (
          <span className="text-slate-400 truncate text-sm font-medium">{subtitle}</span>
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

// --- High-level Template Component ---

/**
 * Helper component for sortable column headers
 */
function SortableHeader({
  label,
  sortKey,
  currentSort,
  onSort,
  align = 'center',
  color,
  sortable = true,
  className,
}) {
  const isSorted = currentSort.key === sortKey;

  return (
    <TableHeaderCell
      align={align}
      color={color}
      className={cn(sortable ? 'cursor-pointer select-none hover:bg-white/5' : '', className)}
      onClick={() => sortable && onSort(sortKey)}
    >
      <div
        className={cn(
          'flex items-center gap-2',
          align === 'left' ? 'justify-start' : align === 'right' ? 'justify-end' : 'justify-center'
        )}
      >
        {label}
        {sortable &&
          (isSorted ? (
            currentSort.direction === 'asc' ? (
              <ArrowUp className="w-3 h-3 text-primary" />
            ) : (
              <ArrowDown className="w-3 h-3 text-primary" />
            )
          ) : (
            <ArrowUpDown className="w-3 h-3 text-slate-400/30" />
          ))}
      </div>
    </TableHeaderCell>
  );
}

/**
 * StatsTable - A generic table template for displaying statistics.
 * This is the counterpart to StatsList for tabular data.
 *
 * @param {string} title - Card title
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} color - Theme color for the card
 * @param {Array} data - Array of objects to display
 * @param {Array} columns - Column configuration
 * @param {Object} defaultSort - Initial sort state { key, direction }
 * @param {string} managerKey - The key for the manager name in data objects (for default manager column)
 * @param {string} managerIdKey - The key for the manager ID in data objects
 * @param {string} managerIconKey - The key for the manager icon URL in data objects
 * @param {string} managerColorIndexKey - The key for the manager color index in data objects
 * @param {string} managerSubtitleKey - The key for a subtitle to show under the manager name
 * @param {Function} managerSubtitleRender - Optional custom render for the manager subtitle (receives value and row)
 * @param {boolean} showManagerColumn - Whether to show the default manager avatar/name column
 * @param {string} className - Additional CSS classes for the card
 * @param {React.ReactNode} children - Optional custom table body (overrides default column mapping)
 */
export default function StatsTable({
  title,
  icon,
  color = 'blue',
  data = [],
  columns = [],
  defaultSort = { key: '', direction: 'desc' },
  managerKey = 'user_name',
  managerIdKey = 'user_id',
  managerIconKey = 'user_icon',
  managerColorIndexKey = 'color_index',
  managerSubtitleKey,
  managerSubtitleRender,
  managerColumnIndex = 0,
  showManagerColumn = true,
  managerAlign = 'left',
  className = '',
  children,
}) {
  const [sortConfig, setSortConfig] = useState(defaultSort);

  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    let sortableItems = [...data];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const col = columns.find((c) => c.key === sortConfig.key);

        let aValue = col?.sortValue ? col.sortValue(a) : a[sortConfig.key];
        let bValue = col?.sortValue ? col.sortValue(b) : b[sortConfig.key];

        if (sortConfig.key === managerKey) {
          aValue = a[managerKey] || '';
          bValue = b[managerKey] || '';
        }

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortableItems;
  }, [data, sortConfig, columns, managerKey]);

  const handleSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  return (
    <ElegantCard title={title} icon={icon} color={color} className={cn('h-full', className)}>
      <Table>
        <TableHeader>
          <TableRow hovering={false}>
            {(() => {
              const headers = columns.map((col) => (
                <SortableHeader
                  key={col.key}
                  label={col.label}
                  sortKey={col.key}
                  currentSort={sortConfig}
                  onSort={handleSort}
                  align={col.align}
                  color={col.color}
                  sortable={col.sortable !== false}
                  className={col.headerClassName}
                />
              ));

              if (showManagerColumn) {
                headers.splice(
                  managerColumnIndex,
                  0,
                  <SortableHeader
                    key="manager-header"
                    label="Manager"
                    sortKey={managerKey}
                    currentSort={sortConfig}
                    onSort={handleSort}
                    align={managerAlign}
                  />
                );
              }
              return headers;
            })()}
          </TableRow>
        </TableHeader>
        {children ? (
          children
        ) : (
          <tbody className="">
            {sortedData.map((row, idx) => {
              const uName = row[managerKey] || 'Unknown';
              const uId = row[managerIdKey];
              const uIcon = row[managerIconKey];
              const uColorIdx = row[managerColorIndexKey];
              const userColor = getColorForUser(uId, uName, uColorIdx);

              return (
                <TableRow key={idx}>
                  {(() => {
                    const cells = columns.map((col) => {
                      const value = row[col.key];
                      const content = col.render ? col.render(value, row) : value;
                      const cellClassName =
                        typeof col.className === 'function'
                          ? col.className(value, row)
                          : col.className;

                      return (
                        <TableCell
                          key={col.key}
                          align={col.align}
                          className={cellClassName}
                          color={col.color}
                        >
                          {content}
                        </TableCell>
                      );
                    });

                    if (showManagerColumn) {
                      cells.splice(
                        managerColumnIndex,
                        0,
                        <TableCell key="manager-cell" align={managerAlign}>
                          <TableIdentity
                            name={uName}
                            image={uIcon}
                            link={`/user/${uId || uName}`}
                            color={userColor.text}
                            subtitle={
                              managerSubtitleKey || managerSubtitleRender
                                ? managerSubtitleRender
                                  ? managerSubtitleRender(row[managerSubtitleKey], row)
                                  : row[managerSubtitleKey]
                                : null
                            }
                          />
                        </TableCell>
                      );
                    }
                    return cells;
                  })()}
                </TableRow>
              );
            })}
          </tbody>
        )}
      </Table>
    </ElegantCard>
  );
}
