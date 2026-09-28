export type PredictionSubject = 'player' | 'manager';
export type PredictionQuestionId = 'top-scorer' | 'champion-manager';

export interface PredictionQuestion {
  id: PredictionQuestionId;
  section: PredictionSubject;
  prompt: string;
  order: number;
}

export const PREDICTION_QUESTIONS: readonly PredictionQuestion[] = [
  { id: 'top-scorer', section: 'player', prompt: '¿Qué jugador sumará más puntos?', order: 1 },
  {
    id: 'champion-manager',
    section: 'manager',
    prompt: '¿Qué mánager terminará primero?',
    order: 2,
  },
] as const;

export const PREDICTION_SECTIONS = [
  {
    id: 'player',
    title: 'Jugadores',
    description: 'Elige al jugador que destacará esta temporada.',
  },
  { id: 'manager', title: 'Mánagers', description: 'Piensa en la clasificación final de la liga.' },
] as const;
