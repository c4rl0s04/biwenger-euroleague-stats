'use client';

import { Check, ChevronDown, Search, X } from 'lucide-react';
import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Avatar } from '../primitives/Avatar';
import { Button } from '../primitives/Button';
import { IconButton } from '../primitives/IconButton';
import { Input } from '../primitives/Input';
import { EmptyState } from '../compositions/EmptyState';
import { ModalDialog } from './ModalDialog';

export interface SearchableOption {
  id: string;
  label: string;
  description?: string;
  image?: string | null;
}

export interface SearchableSelectProps {
  label: string;
  options: readonly SearchableOption[];
  value: string | null;
  onChange: (id: string) => void;
  placeholder: string;
  searchPlaceholder: string;
  emptyMessage: string;
  renderOption?: (option: SearchableOption) => ReactNode;
}

function normalize(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('es');
}

export function SearchableSelect({
  label,
  options,
  value,
  onChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  renderOption,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const titleId = useId();
  const listId = useId();
  const selected = options.find((option) => option.id === value);
  const results = useMemo(() => {
    const needle = normalize(query.trim());
    return needle
      ? options.filter((option) =>
          normalize(`${option.label} ${option.description ?? ''}`).includes(needle)
        )
      : options;
  }, [options, query]);
  const currentIndex = Math.min(activeIndex, Math.max(results.length - 1, 0));

  useEffect(() => {
    if (open && results.length) {
      document
        .getElementById(`${listId}-option-${currentIndex}`)
        ?.scrollIntoView({ block: 'nearest' });
    }
  }, [open, listId, currentIndex, results.length]);

  function choose(id: string) {
    onChange(id);
    setOpen(false);
  }

  function openPicker() {
    setQuery('');
    setActiveIndex(0);
    setOpen(true);
  }

  return (
    <>
      <Button
        ref={triggerRef}
        variant="secondary"
        className="flex h-auto min-h-12 w-full items-center justify-between gap-3 text-left"
        onClick={openPicker}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`${label}: ${selected?.label ?? placeholder}`}
      >
        <span className="flex min-w-0 items-center gap-3">
          {selected ? (
            <Avatar src={selected.image} alt="" fallback={selected.label.slice(0, 1)} size="sm" />
          ) : null}
          <span className="min-w-0 truncate">{selected?.label ?? placeholder}</span>
        </span>
        <ChevronDown size={18} className="shrink-0" aria-hidden="true" />
      </Button>
      {open && typeof document !== 'undefined'
        ? createPortal(
            <div className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center sm:p-6">
              <button
                type="button"
                className="absolute inset-0 bg-[hsl(var(--surface-app)/0.8)]"
                onClick={() => setOpen(false)}
                aria-label="Cerrar selector"
                tabIndex={-1}
              />
              <ModalDialog
                as="section"
                onClose={() => setOpen(false)}
                initialFocusRef={searchRef}
                returnFocusRef={triggerRef}
                aria-labelledby={titleId}
                className="relative flex max-h-[min(85dvh,44rem)] w-full flex-col rounded-t-[var(--radius-surface)] border border-[hsl(var(--border-default))] bg-[hsl(var(--surface-popover))] text-[hsl(var(--content-primary))] shadow-2xl sm:max-w-lg sm:rounded-[var(--radius-surface)]"
              >
                <div className="flex items-center justify-between gap-3 border-b border-[hsl(var(--border-default))] px-5 py-4">
                  <h2
                    id={titleId}
                    className="font-sans! text-lg font-semibold tracking-normal! normal-case!"
                  >
                    {label}
                  </h2>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    aria-label="Cerrar selector"
                    onClick={() => setOpen(false)}
                  >
                    <X size={20} aria-hidden="true" />
                  </IconButton>
                </div>
                <div className="relative px-5 py-4">
                  <Search
                    size={18}
                    className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 text-[hsl(var(--content-muted))]"
                    aria-hidden="true"
                  />
                  <Input
                    ref={searchRef}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded="true"
                    aria-controls={listId}
                    aria-activedescendant={
                      results.length ? `${listId}-option-${currentIndex}` : undefined
                    }
                    aria-label={`Buscar ${label.toLocaleLowerCase('es')}`}
                    placeholder={searchPlaceholder}
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setActiveIndex(0);
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'ArrowDown' && results.length) {
                        event.preventDefault();
                        setActiveIndex((index) => Math.min(index + 1, results.length - 1));
                      } else if (event.key === 'ArrowUp' && results.length) {
                        event.preventDefault();
                        setActiveIndex((index) => Math.max(index - 1, 0));
                      } else if (event.key === 'Enter' && results[currentIndex]) {
                        event.preventDefault();
                        choose(results[currentIndex].id);
                      }
                    }}
                    className="pl-10"
                  />
                </div>
                <div className="min-h-0 overflow-y-auto px-3 pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-4">
                  {results.length ? (
                    <div id={listId} role="listbox" aria-label={label} className="space-y-1">
                      {results.map((option, index) => (
                        <button
                          key={option.id}
                          id={`${listId}-option-${index}`}
                          type="button"
                          role="option"
                          aria-selected={option.id === value}
                          tabIndex={-1}
                          onClick={() => choose(option.id)}
                          className={`flex min-h-12 w-full items-center gap-3 rounded-[var(--radius-control)] px-3 py-2 text-left font-sans text-sm transition-colors motion-reduce:transition-none ${index === currentIndex ? 'bg-[hsl(var(--surface-secondary))]' : 'hover:bg-[hsl(var(--surface-secondary))]'} focus-visible:outline-2 focus-visible:outline-[hsl(var(--focus-ring))]`}
                        >
                          {renderOption ? (
                            renderOption(option)
                          ) : (
                            <>
                              <Avatar
                                src={option.image}
                                alt=""
                                fallback={option.label.slice(0, 1)}
                                size="sm"
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate font-medium">{option.label}</span>
                                {option.description ? (
                                  <span className="block truncate text-xs text-[hsl(var(--content-muted))]">
                                    {option.description}
                                  </span>
                                ) : null}
                              </span>
                            </>
                          )}
                          {option.id === value ? (
                            <Check
                              size={17}
                              className="ml-auto shrink-0 text-[hsl(var(--action-primary))]"
                              aria-hidden="true"
                            />
                          ) : null}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <EmptyState className="py-10">{emptyMessage}</EmptyState>
                  )}
                </div>
              </ModalDialog>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
