import { X } from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  IconButton,
} from '@/components/ui/foundation';
import type { PredictionQuestion } from '../models/questions';
import type { SeasonPredictionOptions } from '../models/options';
import { ManagerPredictionPicker } from './ManagerPredictionPicker';
import { PlayerPredictionPicker } from './PlayerPredictionPicker';
import { TeamPredictionPicker } from './TeamPredictionPicker';

export function PredictionQuestionCard({
  question,
  options,
  value,
  onChange,
  headingLevel = 3,
  disabled = false,
  phone = false,
}: {
  question: PredictionQuestion;
  options: SeasonPredictionOptions;
  value: string | null;
  onChange: (id: string | null) => void;
  headingLevel?: 3 | 4;
  disabled?: boolean;
  phone?: boolean;
}) {
  const choices =
    question.section === 'player'
      ? options.players
      : question.section === 'team'
        ? options.teams
        : options.managers;
  const selected = choices.find((choice) => choice.id === value);

  return (
    <Card
      variant="default"
      density={phone ? 'compact' : 'comfortable'}
      aria-labelledby={`${question.id}-title`}
      className="h-full"
    >
      <CardHeader>
        <CardTitle
          id={`${question.id}-title`}
          as={headingLevel === 4 ? 'h4' : 'h3'}
          className={phone ? 'text-base! leading-snug' : 'text-lg!'}
        >
          {question.prompt}
        </CardTitle>
      </CardHeader>
      <CardContent className={phone && !disabled ? 'flex items-center gap-2' : 'space-y-3'}>
        {disabled ? (
          <p className="text-sm text-[hsl(var(--content-secondary))]">
            {selected?.name ?? 'Sin respuesta'}
          </p>
        ) : (
          <div className="min-w-0 flex-1">
            {question.section === 'player' ? (
              <PlayerPredictionPicker options={choices} value={value} onChange={onChange} />
            ) : question.section === 'team' ? (
              <TeamPredictionPicker options={choices} value={value} onChange={onChange} />
            ) : (
              <ManagerPredictionPicker options={choices} value={value} onChange={onChange} />
            )}
          </div>
        )}
        {selected && !disabled && phone ? (
          <IconButton
            variant="ghost"
            aria-label={`Borrar elección: ${selected.name}`}
            onClick={() => onChange(null)}
          >
            <X size={18} aria-hidden="true" />
          </IconButton>
        ) : null}
        {selected && !disabled && !phone ? (
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <span className="text-[hsl(var(--content-muted))]">
              Tu elección:{' '}
              <strong className="font-medium text-[hsl(var(--content-primary))]">
                {selected.name}
              </strong>
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChange(null)}
              aria-label={`Borrar elección: ${selected.name}`}
            >
              Borrar elección
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
