'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({
  value,
  onChange,
  options,
  placeholder = 'Seleccionar...',
  className = '',
  buttonClassName = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const isCentered =
    typeof buttonClassName === 'string' && buttonClassName.includes('justify-center');

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full h-[38px] appearance-none bg-secondary/50 border border-border/50 rounded-lg px-3 py-2 text-left focus:outline-none focus:ring-1 focus:ring-primary/50 hover:bg-secondary/70 transition-colors flex items-center cursor-pointer ${isCentered ? 'justify-center' : 'justify-between'} ${buttonClassName}`}
      >
        <span
          className={`text-inherit whitespace-nowrap min-w-0 ${isCentered ? 'flex-shrink-0' : 'flex-1'} ${!selectedOption ? 'text-muted-foreground' : 'text-foreground font-medium'}`}
          title={selectedOption ? selectedOption.label : placeholder}
        >
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown
          size={isCentered ? 32 : 16}
          className={`text-muted-foreground transition-transform duration-200 shrink-0 ml-2 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-card/95 backdrop-blur-xl border border-border/50 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
          <div className="max-h-80 overflow-y-auto p-1 py-1.5 space-y-0.5 sidebar-scroll">
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-4 py-3.5 rounded-lg transition-colors flex items-center justify-between group cursor-pointer ${
                  value === option.value
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-secondary/80 hover:text-foreground'
                }`}
              >
                <div className="flex-1 flex flex-col min-w-0 pr-6">
                  <span className="font-bold text-xl md:text-2xl tracking-normal truncate">
                    {option.label}
                  </span>
                  {option.sublabel && (
                    <span className="text-xs md:text-sm opacity-60 font-medium mt-0.5">
                      {option.sublabel}
                    </span>
                  )}
                </div>

                {option.sideLabel !== undefined && (
                  <div className="flex flex-col items-end shrink-0 mr-4">
                    <span
                      className="text-xl md:text-3xl font-display uppercase tracking-tighter leading-none"
                      style={
                        option.sideLabelColor
                          ? { color: option.sideLabelColor }
                          : { color: 'var(--primary)' }
                      }
                    >
                      {option.sideLabel}
                    </span>
                    <span className="text-[10px] md:text-[12px] uppercase opacity-40 font-black tracking-widest mt-1">
                      DIF
                    </span>
                  </div>
                )}

                {value === option.value && <Check size={18} className="text-primary shrink-0" />}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
