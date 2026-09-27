'use client';

import { ModalDialog } from '@/components/ui/foundation';

import { X } from 'lucide-react';
import { createPortal } from 'react-dom';
import { useId, useRef, type ReactNode, type RefObject } from 'react';

interface MobileBottomSheetProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export default function MobileBottomSheet({
  open,
  onClose,
  title,
  description,
  children,
  returnFocusRef,
}: MobileBottomSheetProps) {
  const titleId = useId();
  const descriptionId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);
  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div className="mobile-native-sheet-layer">
      <button
        type="button"
        className="mobile-native-sheet-backdrop"
        onClick={onClose}
        aria-label="Cerrar"
      />
      <ModalDialog
        onClose={onClose}
        initialFocusRef={closeRef}
        returnFocusRef={returnFocusRef}
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        className="mobile-native-sheet"
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
        <div className="mobile-native-sheet-body">{children}</div>
      </ModalDialog>
    </div>,
    document.body
  );
}
