'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Reorder, useDragControls, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronUp, GripVertical, X } from 'lucide-react';
import {
  Avatar,
  Button,
  Card,
  CardContent,
  IconButton,
  ModalDialog,
} from '@/components/ui/foundation';
import type { PredictionChoice } from '../models/options';
import type { PredictionQuestion } from '../models/questions';
import { PredictionCardHeading } from './PredictionCardHeading';

function RankingRow({
  id,
  position,
  choice,
  count,
  disabled,
  onMove,
  onDragStart,
}: {
  id: string;
  position: number;
  choice: PredictionChoice;
  count: number;
  disabled: boolean;
  onMove: (from: number, to: number) => void;
  onDragStart?: (id: string) => void;
}) {
  const controls = useDragControls();
  const reducedMotion = useReducedMotion();
  const handleRef = useRef<HTMLButtonElement>(null);
  function moveWithFocus(from: number, to: number, keyboard: boolean) {
    onMove(from, to);
    if (keyboard) requestAnimationFrame(() => handleRef.current?.focus());
  }
  const content = (
    <div className="flex min-h-14 items-center gap-3 rounded-[var(--radius-control)] border border-[hsl(var(--border-default))] bg-[hsl(var(--surface-secondary))] px-3 py-2">
      {!disabled ? (
        <button
          ref={handleRef}
          type="button"
          className="flex size-11 shrink-0 touch-none items-center justify-center rounded-[var(--radius-control)] text-[hsl(var(--content-muted))] focus-visible:outline-2 focus-visible:outline-[hsl(var(--focus-ring))]"
          style={{ touchAction: 'none' }}
          aria-label={`Arrastrar ${choice.name}`}
          onPointerDown={(event) => {
            onDragStart?.(id);
            controls.start(event);
          }}
        >
          <GripVertical size={19} aria-hidden="true" />
        </button>
      ) : null}
      <span className="w-6 shrink-0 font-semibold tabular-nums text-[hsl(var(--action-primary))]">
        {position + 1}.
      </span>
      <span className="min-w-0 flex-1 break-words font-medium">{choice.name}</span>
      {!disabled ? (
        <span className="flex shrink-0 gap-1">
          <button
            type="button"
            disabled={position === 0}
            onClick={(event) => moveWithFocus(position, position - 1, event.detail === 0)}
            aria-label={`Subir ${choice.name}`}
            className="flex size-11 items-center justify-center rounded-[var(--radius-control)] disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[hsl(var(--focus-ring))]"
          >
            <ChevronUp size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            disabled={position === count - 1}
            onClick={(event) => moveWithFocus(position, position + 1, event.detail === 0)}
            aria-label={`Bajar ${choice.name}`}
            className="flex size-11 items-center justify-center rounded-[var(--radius-control)] disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-[hsl(var(--focus-ring))]"
          >
            <ChevronDown size={18} aria-hidden="true" />
          </button>
        </span>
      ) : null}
    </div>
  );
  return disabled ? (
    <li>{content}</li>
  ) : (
    <Reorder.Item
      as="li"
      value={id}
      dragListener={false}
      dragControls={controls}
      transition={reducedMotion ? { duration: 0 } : undefined}
      className="list-none touch-pan-y"
    >
      {content}
    </Reorder.Item>
  );
}

export function RankingPredictionCard({
  question,
  options,
  value,
  onChange,
  disabled,
  phone = false,
}: {
  question: PredictionQuestion;
  options: readonly PredictionChoice[];
  value: readonly string[] | null;
  onChange: (ids: string[] | null) => void;
  disabled: boolean;
  phone?: boolean;
}) {
  const [editorOpen, setEditorOpen] = useState(false);
  const editorTitleId = useId();
  const openButtonRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const initial = useMemo(() => options.map((choice) => choice.id), [options]);
  const draft = useMemo(() => (value ? [...value] : initial), [value, initial]);
  const [announcement, setAnnouncement] = useState('');
  const draggedId = useRef<string | null>(null);
  const byId = new Map(options.map((choice) => [choice.id, choice]));
  function changeOrder(ids: string[]) {
    onChange(ids);
    const moved = draggedId.current
      ? ids.indexOf(draggedId.current)
      : ids.findIndex((id, index) => id !== draft[index]);
    if (moved !== -1)
      setAnnouncement(
        `${byId.get(ids[moved])?.name ?? 'Elemento'} ahora está en la posición ${moved + 1}.`
      );
  }
  function move(from: number, to: number) {
    const next = [...draft];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    changeOrder(next);
    setAnnouncement(`${byId.get(item)?.name ?? 'Elemento'} ahora está en la posición ${to + 1}.`);
  }
  const rankingContent = (
    <div className="space-y-4">
      <p className="text-sm text-[hsl(var(--content-muted))]">
        {disabled
          ? 'Clasificación elegida'
          : 'Arrastra desde el asa o usa los botones para ordenar. También puedes mantener el orden inicial.'}
      </p>
      <p className="sr-only" role="status" aria-live="polite">
        {announcement}
      </p>
      {disabled && !value ? (
        <p className="text-sm text-[hsl(var(--content-muted))]">Sin respuesta</p>
      ) : disabled ? (
        <ol className="space-y-2">
          {draft.map((id, index) => (
            <RankingRow
              key={id}
              id={id}
              position={index}
              choice={byId.get(id)!}
              count={draft.length}
              disabled
              onMove={move}
            />
          ))}
        </ol>
      ) : (
        <Reorder.Group
          as="ol"
          axis="y"
          values={draft}
          onReorder={changeOrder}
          className="space-y-2"
        >
          {draft.map((id, index) => (
            <RankingRow
              key={id}
              id={id}
              position={index}
              choice={byId.get(id)!}
              count={draft.length}
              disabled={false}
              onMove={move}
              onDragStart={(itemId) => {
                draggedId.current = itemId;
              }}
            />
          ))}
        </Reorder.Group>
      )}
      {!disabled ? (
        <div className="flex flex-wrap gap-2">
          {!value ? (
            <Button variant="secondary" onClick={() => onChange([...draft])}>
              Usar este orden
            </Button>
          ) : null}
          {value ? (
            <Button
              variant="ghost"
              onClick={() => {
                onChange(null);
                setAnnouncement('Clasificación borrada.');
              }}
            >
              Borrar clasificación
            </Button>
          ) : null}
        </div>
      ) : null}
      {!value && !disabled ? (
        <p className="text-sm text-[hsl(var(--content-muted))]">
          Aún no has respondido a esta clasificación.
        </p>
      ) : null}
    </div>
  );

  if (!phone)
    return (
      <Card aria-labelledby={`${question.id}-title`} className="lg:col-span-2">
        <PredictionCardHeading
          question={question}
          answered={Boolean(value)}
          disabled={disabled}
          phone={false}
        />
        <CardContent>{rankingContent}</CardContent>
      </Card>
    );

  return (
    <>
      <Card
        density="compact"
        aria-labelledby={`${question.id}-title`}
        className={value ? 'border-l-[3px] border-l-[hsl(var(--action-primary))]' : ''}
      >
        <PredictionCardHeading
          question={question}
          answered={Boolean(value)}
          disabled={disabled}
          phone
        />
        <CardContent className="space-y-4">
          {value ? (
            <ol className="space-y-1.5 text-sm">
              {draft.slice(0, 3).map((id, index) => (
                <li
                  key={id}
                  className="flex min-w-0 items-center gap-2.5 rounded-[var(--radius-control)] bg-[hsl(var(--surface-secondary))] px-3 py-2"
                >
                  <span className="w-5 shrink-0 font-semibold tabular-nums text-[hsl(var(--action-primary))]">
                    {index + 1}
                  </span>
                  <Avatar
                    src={byId.get(id)?.image}
                    alt=""
                    fallback={(byId.get(id)?.name ?? '?').slice(0, 1)}
                    size="sm"
                  />
                  <span className="min-w-0 flex-1 break-words font-medium">
                    {byId.get(id)?.name ?? 'Candidato desconocido'}
                  </span>
                </li>
              ))}
              {draft.length > 3 ? (
                <li className="px-3 pt-1 text-xs text-[hsl(var(--content-muted))]">
                  Y {draft.length - 3} posiciones más
                </li>
              ) : null}
            </ol>
          ) : (
            <div className="rounded-[var(--radius-control)] border border-dashed border-[hsl(var(--border-default))] px-3 py-3 text-sm text-[hsl(var(--content-muted))]">
              Ordena los {options.length} {question.section === 'team' ? 'equipos' : 'mánagers'} de
              la temporada.
            </div>
          )}
          {(!disabled || value) && (
            <div className="flex flex-col items-stretch gap-1">
              <Button
                ref={openButtonRef}
                variant="secondary"
                className="w-full"
                onClick={() => setEditorOpen(true)}
              >
                {disabled ? 'Ver clasificación' : value ? 'Cambiar orden' : 'Ordenar clasificación'}
              </Button>
              {!disabled && value ? (
                <Button variant="ghost" size="sm" onClick={() => onChange(null)}>
                  Borrar clasificación
                </Button>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
      {editorOpen && typeof document !== 'undefined'
        ? createPortal(
            <ModalDialog
              as="section"
              aria-labelledby={editorTitleId}
              onClose={() => setEditorOpen(false)}
              initialFocusRef={closeButtonRef}
              returnFocusRef={openButtonRef}
              className="fixed inset-0 z-[160] flex h-dvh flex-col bg-[hsl(var(--surface-app))] text-[hsl(var(--content-primary))]"
            >
              <div className="flex shrink-0 items-start gap-3 border-b border-[hsl(var(--border-default))] px-4 pb-4 pt-[max(1rem,env(safe-area-inset-top))]">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-[hsl(var(--action-primary))]">
                    {question.section === 'team' ? 'Equipos' : 'Mánagers'}
                  </p>
                  <h2
                    id={editorTitleId}
                    className="font-sans! text-lg font-semibold tracking-normal! normal-case!"
                  >
                    {question.prompt}
                  </h2>
                </div>
                <IconButton
                  ref={closeButtonRef}
                  variant="ghost"
                  aria-label="Cerrar clasificación"
                  onClick={() => setEditorOpen(false)}
                >
                  <X size={20} aria-hidden="true" />
                </IconButton>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-5">
                {rankingContent}
              </div>
              <div className="shrink-0 border-t border-[hsl(var(--border-default))] bg-[hsl(var(--surface-app))] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3">
                <Button className="w-full" onClick={() => setEditorOpen(false)}>
                  Volver a las preguntas
                </Button>
                {!disabled ? (
                  <p className="mt-2 text-center text-xs text-[hsl(var(--content-muted))]">
                    Recuerda guardar las predicciones al terminar.
                  </p>
                ) : null}
              </div>
            </ModalDialog>,
            document.body
          )
        : null}
    </>
  );
}
