import { Button, Card, CardContent, CardHeader, CardTitle } from '@/components/ui/foundation';
import type { PredictionQuestion } from '../models/questions';
import type { SeasonPredictionOptions } from '../models/options';
import { ManagerPredictionPicker } from './ManagerPredictionPicker';
import { PlayerPredictionPicker } from './PlayerPredictionPicker';

export function PredictionQuestionCard({
  question,
  options,
  value,
  onChange,
  headingLevel = 3,
}: {
  question: PredictionQuestion;
  options: SeasonPredictionOptions;
  value: string | null;
  onChange: (id: string | null) => void;
  headingLevel?: 3 | 4;
}) {
  const choices = question.section === 'player' ? options.players : options.managers;
  const selected = choices.find((choice) => choice.id === value);

  return (
    <Card variant="default" aria-labelledby={`${question.id}-title`} className="h-full">
      <CardHeader>
        <CardTitle
          id={`${question.id}-title`}
          as={headingLevel === 4 ? 'h4' : 'h3'}
          className="text-lg!"
        >
          {question.prompt}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {question.section === 'player' ? (
          <PlayerPredictionPicker options={choices} value={value} onChange={onChange} />
        ) : (
          <ManagerPredictionPicker options={choices} value={value} onChange={onChange} />
        )}
        {selected ? (
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
