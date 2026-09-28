'use client';

import { ModalDialog } from '@/components/ui/foundation';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import {
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
  type RefObject,
} from 'react';

type SearchSheetStyle = CSSProperties & {
  '--mobile-keyboard-inset'?: string;
};

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  initialFocusRef?: RefObject<HTMLElement | null>;
  returnFocusRef?: RefObject<HTMLElement | null>;
  variant?: 'default' | 'search';
}

export default function MobileBottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  initialFocusRef,
  returnFocusRef,
  variant = 'default',
}: MobileBottomSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  const layoutViewportHeightRef = useRef(typeof window === 'undefined' ? 0 : window.innerHeight);
  const [keyboardInset, setKeyboardInset] = useState(0);

  useEffect(() => {
    if (!open && typeof window !== 'undefined') {
      layoutViewportHeightRef.current = window.innerHeight;
      setKeyboardInset(0);
      return undefined;
    }
    if (!open || variant !== 'search' || !window.visualViewport) return undefined;

    const viewport = window.visualViewport;
    const syncKeyboardInset = () => {
      const overlap = layoutViewportHeightRef.current - viewport.height - viewport.offsetTop;
      setKeyboardInset(Math.max(0, overlap));
    };

    syncKeyboardInset();
    viewport.addEventListener('resize', syncKeyboardInset);
    viewport.addEventListener('scroll', syncKeyboardInset);
    return () => {
      viewport.removeEventListener('resize', syncKeyboardInset);
      viewport.removeEventListener('scroll', syncKeyboardInset);
    };
  }, [open, variant]);

  if (!open || typeof document === 'undefined') return null;

  const layerStyle: SearchSheetStyle | undefined =
    variant === 'search' ? { '--mobile-keyboard-inset': `${keyboardInset}px` } : undefined;

  return createPortal(
    <div
      className={`mobile-native-sheet-layer ${
        variant === 'search' ? 'mobile-native-sheet-layer-search' : ''
      }`}
      style={layerStyle}
    >
      <button
        type="button"
        className="mobile-native-sheet-backdrop"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <ModalDialog
        onClose={onClose}
        initialFocusRef={initialFocusRef ?? closeRef}
        preventInitialFocusScroll={variant === 'search'}
        returnFocusRef={returnFocusRef}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className={`mobile-native-sheet ${variant === 'search' ? 'mobile-native-sheet-search' : ''}`}
      >
        <span className="mobile-native-sheet-handle" aria-hidden="true" />
        <div className="mobile-native-sheet-header">
          <div>
            <h2 id={titleId}>{title}</h2>
            {description && <p id={descriptionId}>{description}</p>}
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            className="mobile-native-icon-button"
            aria-label="Cerrar hoja"
          >
            <X size={20} aria-hidden="true" />
          </button>
        </div>
        <div
          className={`mobile-native-sheet-body ${variant === 'search' ? 'mobile-native-sheet-body-search' : ''}`}
        >
          {children}
        </div>
      </ModalDialog>
    </div>,
    document.body
  );
}
