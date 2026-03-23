'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getColorForUser } from '@/lib/constants/colors';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import Image from 'next/image';
import Link from 'next/link';

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
    <th
      className={cn(
        'px-6 py-3 transition-colors text-slate-400 font-medium text-xs uppercase tracking-wider font-display font-black',
        sortable ? 'cursor-pointer select-none hover:bg-white/5' : '',
        align === 'left' ? 'text-left' : align === 'right' ? 'text-right' : 'text-center'
      )}
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
    </th>
  );
}

/**
 * ManagerTable - A generic table component for displaying manager-related statistics.
 *
 * @param {string} title - Card title
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} color - Theme color for the card
 * @param {Array} data - Array of objects to display
 * @param {Array} columns - Column configuration
 * @param {Object} defaultSort - Initial sort state { key, direction }
 * @param {string} managerKey - The key for the manager name in data objects
 * @param {string} managerIdKey - The key for the manager ID in data objects
 * @param {string} managerIconKey - The key for the manager icon URL in data objects
 * @param {string} managerColorIndexKey - The key for the manager color index in data objects
 * @param {string} className - Additional CSS classes for the card
 */
export default function ManagerTable({
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
  className = '',
}) {
  const [sortConfig, setSortConfig] = useState(defaultSort);

  const sortedData = useMemo(() => {
    if (!data || !Array.isArray(data)) return [];

    let sortableItems = [...data];
    if (sortConfig.key) {
      sortableItems.sort((a, b) => {
        const col = columns.find((c) => c.key === sortConfig.key);

        // Use custom sortValue if provided, otherwise fallback to standard key access
        let aValue = col?.sortValue ? col.sortValue(a) : a[sortConfig.key];
        let bValue = col?.sortValue ? col.sortValue(b) : b[sortConfig.key];

        // Manager name fallback for sorting the first column
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse">
          <thead className="bg-white/5 border-y border-white/5">
            <tr>
              <SortableHeader
                label="Manager"
                sortKey={managerKey}
                currentSort={sortConfig}
                onSort={handleSort}
                align="left"
              />
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
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {sortedData.map((row, idx) => {
              const uName = row[managerKey] || 'Unknown';
              const uId = row[managerIdKey];
              const uIcon = row[managerIconKey];
              const uColorIdx = row[managerColorIndexKey];
              const userColor = getColorForUser(uId, uName, uColorIdx);

              return (
                <tr key={idx} className="hover:bg-white/[0.03] transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
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
                          'font-bold transition-all group-hover:scale-105 origin-left text-base md:text-lg tracking-tight hover:underline whitespace-nowrap',
                          userColor.text
                        )}
                      >
                        {uName}
                      </Link>
                    </div>
                  </td>
                  {columns.map((col) => {
                    const value = row[col.key];
                    const content = col.render ? col.render(value, row) : value;
                    const cellClassName =
                      typeof col.className === 'function'
                        ? col.className(value, row)
                        : col.className;

                    return (
                      <td
                        key={col.key}
                        className={cn(
                          'px-6 py-4 font-display font-black text-base md:text-lg tabular-nums',
                          col.align === 'center'
                            ? 'text-center'
                            : col.align === 'right'
                              ? 'text-right'
                              : 'text-left',
                          cellClassName
                        )}
                      >
                        {content}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </ElegantCard>
  );
}
