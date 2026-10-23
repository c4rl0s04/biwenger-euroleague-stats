'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
  disabled?: boolean;
  sublabel?: string;
  sideLabel?: string | number;
  sideLabelColor?: string;
}

export function nextSelectIndex(
  options: readonly SelectOption[],
  start: number,
  direction: 1 | -1
) {
  for (let offset = 1; offset <= options.length; offset++) {
    const index = (start + direction * offset + options.length) % options.length;
    if (!options[index].disabled) return index;
  }
  return -1;
}

/** Shared interaction for the foundation select and visually compatible legacy adapter. */
export function useSelect({
  value,
  onChange,
  options,
}: {
  value?: string | number | null;
  onChange: (value: string | number) => void;
  options: readonly SelectOption[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const selectedOption = options.find((option) => option.value === value);
  function close(restoreFocus = false) {
    setIsOpen(false);
    if (restoreFocus) triggerRef.current?.focus({ preventScroll: true });
  }
  function open() {
    const selected = options.findIndex((option) => option.value === value && !option.disabled);
    setActiveIndex(selected >= 0 ? selected : nextSelectIndex(options, -1, 1));
    setIsOpen(true);
  }
  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    onChange(option.value);
    close(true);
  }
  useEffect(() => {
    if (!isOpen) return;
    menuRef.current?.focus({ preventScroll: true });
    const outside = (event: Event) => {
      const target = event.target as Node;
      if (!dropdownRef.current?.contains(target) && !menuRef.current?.contains(target))
        setIsOpen(false);
    };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('focusin', outside);
    };
  }, [isOpen]);
  useEffect(() => {
    if (isOpen)
      document.getElementById(`${id}-option-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
  }, [isOpen, activeIndex, id]);
  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!isOpen) open();
      else
        setActiveIndex(nextSelectIndex(options, activeIndex, event.key === 'ArrowDown' ? 1 : -1));
    } else if (isOpen && (event.key === 'Home' || event.key === 'End')) {
      event.preventDefault();
      setActiveIndex(
        nextSelectIndex(options, event.key === 'Home' ? -1 : 0, event.key === 'Home' ? 1 : -1)
      );
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (isOpen) choose(activeIndex);
      else open();
    } else if (event.key === 'Tab' && isOpen) {
      // Continue from the trigger in document order rather than trapping focus inside the menu.
      triggerRef.current?.focus({ preventScroll: true });
      setIsOpen(false);
    }
  }
  return {
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
  };
}
