'use client';

import { useMemo, useRef, useState } from 'react';
import { Reorder, useDragControls, useReducedMotion } from 'framer-motion';
import { ChevronDown, ChevronUp, GripVertical } from 'lucide-react';
import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/foundation';
import type { PredictionChoice } from '../models/options';
import type { PredictionQuestion } from '../models/questions';

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
}: {
  question: PredictionQuestion;
  options: readonly PredictionChoice[];
  value: readonly string[] | null;
  onChange: (ids: string[] | null) => void;
  disabled: boolean;
}) {
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
  return (
    <Card aria-labelledby={`${question.id}-title`} className="lg:col-span-2">
      <CardHeader>
        <CardTitle id={`${question.id}-title`} className="text-lg!">
          {question.prompt}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
      </CardContent>
    </Card>
  );
}
