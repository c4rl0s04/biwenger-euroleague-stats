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

interface VisualViewportBounds {
  top: number;
  height: number;
}

function readVisualViewportBounds(): VisualViewportBounds | null {
  if (typeof window === 'undefined' || !window.visualViewport) return null;
  return {
    top: window.visualViewport.offsetTop,
    height: window.visualViewport.height,
  };
}

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
  const [visualViewport, setVisualViewport] = useState<VisualViewportBounds | null>(() =>
    variant === 'search' ? readVisualViewportBounds() : null
  );

  useEffect(() => {
    if (variant !== 'search' || !window.visualViewport) return undefined;
    const viewport = window.visualViewport;
    const syncViewport = () => {
      setVisualViewport({
        top: viewport.offsetTop,
        height: viewport.height,
      });
    };
    syncViewport();
    viewport.addEventListener('resize', syncViewport);
    viewport.addEventListener('scroll', syncViewport);
    return () => {
      viewport.removeEventListener('resize', syncViewport);
      viewport.removeEventListener('scroll', syncViewport);
    };
  }, [variant]);

  if (!open || typeof document === 'undefined') return null;

  const layerStyle: CSSProperties | undefined =
    variant === 'search' && visualViewport
      ? {
          top: `${visualViewport.top}px`,
          bottom: 'auto',
          height: `${visualViewport.height}px`,
        }
      : undefined;

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
