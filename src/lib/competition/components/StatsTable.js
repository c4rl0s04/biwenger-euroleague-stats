'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getColorForUser } from '../presentation/colors';
import ElegantCard from '@/components/ui/card-variants/ElegantCard';
import {
  Table,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableCell,
  TableIdentity,
} from '@/components/ui/StatsTable';

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
      className={cn(sortable ? 'cursor-pointer select-none hover:bg-secondary/40' : '', className)}
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
            <ArrowUpDown className="w-3 h-3 text-muted-foreground/30" />
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

  const renderManagerIdentity = (row) => {
    const uName = row[managerKey] || 'Unknown';
    const uId = row[managerIdKey];
    const uIcon = row[managerIconKey];
    const uColorIdx = row[managerColorIndexKey];
    const userColor = getColorForUser(uId, uName, uColorIdx);
    return (
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
    );
  };

  return (
    <ElegantCard
      title={title}
      icon={icon}
      color={color}
      padding="p-3 md:p-6"
      className={cn('h-full', className)}
    >
      {!children && (
        <div className="space-y-3 md:hidden">
          {columns.some((column) => column.sortable !== false) && (
            <label className="block text-xs font-bold text-muted-foreground">
              Ordenar resultados
              <select
                value={sortConfig.key}
                onChange={(event) => handleSort(event.target.value)}
                className="mt-2 h-11 w-full rounded-xl border border-border bg-secondary px-3 text-base text-foreground"
              >
                {showManagerColumn && <option value={managerKey}>Manager</option>}
                {columns
                  .filter((column) => column.sortable !== false)
                  .map((column) => (
                    <option key={column.key} value={column.key}>
                      {column.label}
                    </option>
                  ))}
              </select>
            </label>
          )}
          <ul className="space-y-3">
            {sortedData.map((row, idx) => (
              <li
                key={row[managerIdKey] || idx}
                className="rounded-2xl border border-border/70 bg-white/[0.025] p-4"
              >
                {showManagerColumn && <div className="mb-4">{renderManagerIdentity(row)}</div>}
                <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                  {columns.map((column) => {
                    const value = row[column.key];
                    return (
                      <div key={column.key} className="min-w-0 border-t border-white/5 pt-2">
                        <dt className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">
                          {column.label}
                        </dt>
                        <dd className="mt-1 break-words text-sm font-bold text-foreground">
                          {column.render ? column.render(value, row, idx) : value}
                        </dd>
                      </div>
                    );
                  })}
                </dl>
              </li>
            ))}
          </ul>
        </div>
      )}
      <Table className={children ? '' : 'hidden md:block'}>
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
              return (
                <TableRow key={idx}>
                  {(() => {
                    const cells = columns.map((col) => {
                      const value = row[col.key];
                      const content = col.render ? col.render(value, row, idx) : value;
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
                          {renderManagerIdentity(row)}
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
