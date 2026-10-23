'use client';

import { useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown } from 'lucide-react';
import { Button } from '../primitives/Button';
import { useSelect, type SelectOption } from './useSelect';

export type { SelectOption } from './useSelect';
export interface SelectProps {
  label: string;
  options: readonly SelectOption[];
  value?: string | number | null;
  onChange: (value: string | number) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}
export function Select({
  label,
  options,
  value,
  onChange,
  placeholder = 'Seleccionar…',
  disabled,
  className,
}: SelectProps) {
  const {
    id,
    isOpen,
    activeIndex,
    selectedOption,
    triggerRef,
    menuRef,
    dropdownRef,
    setActiveIndex,
    open,
    close,
    choose,
    onKeyDown,
  } = useSelect({ options, value, onChange });
  const [position, setPosition] = useState({ left: 0, top: 0, width: 192, maxHeight: 320 });
  useLayoutEffect(() => {
    if (!isOpen) return;
    const place = () => {
      const rect = triggerRef.current?.getBoundingClientRect();
      if (!rect) return;
      const below = window.innerHeight - rect.bottom - 16;
      const above = rect.top - 16;
      const height = Math.min(320, Math.max(80, below >= 160 || below >= above ? below : above));
      const width = Math.min(Math.max(rect.width, 192), window.innerWidth - 16);
      setPosition({
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
        top: below >= 160 || below >= above ? rect.bottom + 6 : Math.max(8, rect.top - height - 6),
        width,
        maxHeight: height,
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [isOpen, triggerRef]);
  return (
    <div ref={dropdownRef} className={className}>
      <Button
        ref={triggerRef}
        variant="secondary"
        aria-label={label}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-controls={isOpen ? id : undefined}
        disabled={disabled || !options.length}
        onClick={() => (isOpen ? close() : open())}
        onKeyDown={onKeyDown}
        className="w-full min-w-0 justify-between gap-3 text-left"
      >
        <span className="min-w-0 truncate">{selectedOption?.label ?? placeholder}</span>
        <ChevronDown size={16} aria-hidden="true" />
      </Button>
      {isOpen && typeof document !== 'undefined'
        ? createPortal(
            <div
              ref={menuRef}
              id={id}
              role="listbox"
              aria-label={label}
              aria-activedescendant={activeIndex >= 0 ? `${id}-option-${activeIndex}` : undefined}
              tabIndex={-1}
              onKeyDown={onKeyDown}
              style={position}
              className="fixed z-[90] overflow-y-auto rounded-[var(--radius-control)] border border-border bg-popover p-1 text-foreground shadow-xl outline-none"
            >
              {options.map((option, index) => (
                <div
                  key={option.value}
                  id={`${id}-option-${index}`}
                  role="option"
                  aria-selected={option.value === value}
                  aria-disabled={option.disabled || undefined}
                  onPointerMove={() => !option.disabled && setActiveIndex(index)}
                  onClick={() => choose(index)}
                  className={`flex min-h-10 cursor-pointer items-center justify-between gap-3 rounded-md px-3 py-2 text-sm ${option.disabled ? 'cursor-not-allowed opacity-50' : index === activeIndex ? 'bg-primary/10 text-primary' : 'hover:bg-secondary'}`}
                >
                  <span className="min-w-0 truncate">{option.label}</span>
                  {option.value === value && <Check size={16} aria-hidden="true" />}
                </div>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
