'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getColorForUser } from '@/lib/constants/colors';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import Image from 'next/image';
import Link from 'next/link';

// --- Primitive Components (formerly BaseTable) ---

/**
 * Table - A primitive table component with project-standard styling.
 */
export function Table({ children, className }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm text-left border-collapse">{children}</table>
    </div>
  );
}

export function TableHeader({ children, className }) {
  return <thead className={cn('bg-white/5 border-y border-white/5', className)}>{children}</thead>;
}

export function TableHeaderCell({ children, className, align = 'center', colSpan, onClick }) {
  return (
    <th
      colSpan={colSpan}
      onClick={onClick}
      className={cn(
        'px-4 py-3 bg-white/[0.02] transition-colors text-slate-200 font-bold text-xs md:text-sm uppercase tracking-widest font-sans border-b border-white/5',
        align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center',
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

export function TableCell({ children, className, align = 'center', variant = 'default', colSpan }) {
  return (
    <td
      colSpan={colSpan}
      className={cn(
        'px-4 py-2 border-b border-white/5',
        variant === 'numeric'
          ? 'font-display font-black text-lg md:text-xl tabular-nums'
          : 'text-sm md:text-base font-medium',
        align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center',
        className
      )}
    >
      {children}
    </td>
  );
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
  sortable = true,
}) {
  const isSorted = currentSort.key === sortKey;

  return (
    <TableHeaderCell
      align={align}
      className={cn(sortable ? 'cursor-pointer select-none hover:bg-white/5' : '')}
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
  showManagerColumn = true,
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
            {showManagerColumn && (
              <SortableHeader
                label="Manager"
                sortKey={managerKey}
                currentSort={sortConfig}
                onSort={handleSort}
                align="left"
              />
            )}
            {columns.map((col) => (
              <SortableHeader
                key={col.key}
                label={col.label}
                sortKey={col.key}
                currentSort={sortConfig}
                onSort={handleSort}
                align={col.align}
                sortable={col.sortable !== false}
              />
            ))}
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
                  {showManagerColumn && (
                    <TableCell align="left">
                      <div className="flex items-center gap-3 md:gap-4 p-0.5 rounded-xl transition-all">
                        <div className="relative w-9 h-9 md:w-10 md:h-10 shrink-0">
                          {uIcon ? (
                            <Image
                              src={uIcon}
                              alt={uName}
                              fill
                              className="rounded-full object-cover border border-white/5 shadow-md"
                              sizes="40px"
                            />
                          ) : (
                            <div className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-slate-800 flex items-center justify-center text-sm md:text-base font-black text-white shadow-md border border-white/5">
                              {uName.charAt(0)}
                            </div>
                          )}
                        </div>
                        <Link
                          href={`/user/${uId || uName}`}
                          className={cn(
                            'font-bold transition-all group-hover:scale-105 origin-left text-base md:text-lg tracking-tight whitespace-nowrap',
                            userColor.text
                          )}
                        >
                          {uName}
                        </Link>
                      </div>
                    </TableCell>
                  )}
                  {columns.map((col) => {
                    const value = row[col.key];
                    const content = col.render ? col.render(value, row) : value;
                    const cellClassName =
                      typeof col.className === 'function'
                        ? col.className(value, row)
                        : col.className;

                    return (
                      <TableCell
                        key={col.key}
                        variant={col.variant || 'default'}
                        align={col.align}
                        className={cellClassName}
                      >
                        {content}
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </tbody>
        )}
      </Table>
    </ElegantCard>
  );
}
