export const QUESTION_SET_VERSION = 'season-predictions-v1';

export type PredictionSubject = 'player' | 'team' | 'manager';
export type PredictionQuestionKind = 'single' | 'ranking';

export interface PredictionQuestion {
  id: string;
  section: PredictionSubject;
  kind: PredictionQuestionKind;
  prompt: string;
  order: number;
}

export const PREDICTION_QUESTIONS = [
  {
    id: 'player-total-points',
    section: 'player',
    kind: 'single',
    prompt: '¿Qué jugador sumará más puntos fantasy?',
    order: 1,
  },
  {
    id: 'player-round-leader',
    section: 'player',
    kind: 'single',
    prompt: '¿Qué jugador liderará más jornadas en puntos fantasy?',
    order: 2,
  },
  {
    id: 'player-best-round',
    section: 'player',
    kind: 'single',
    prompt: '¿Qué jugador logrará la mayor puntuación fantasy en una jornada?',
    order: 3,
  },
  {
    id: 'player-underrated',
    section: 'player',
    kind: 'single',
    prompt: '¿Qué jugador será el más infravalorado?',
    order: 4,
  },
  {
    id: 'player-overrated',
    section: 'player',
    kind: 'single',
    prompt: '¿Qué jugador será el más sobrevalorado?',
    order: 5,
  },
  {
    id: 'team-ranking',
    section: 'team',
    kind: 'ranking',
    prompt: '¿Cómo terminará la clasificación de la temporada regular?',
    order: 6,
  },
  {
    id: 'team-champion',
    section: 'team',
    kind: 'single',
    prompt: '¿Qué equipo ganará la EuroLeague?',
    order: 7,
  },
  {
    id: 'team-underrated',
    section: 'team',
    kind: 'single',
    prompt: '¿Qué equipo será el más infravalorado?',
    order: 8,
  },
  {
    id: 'team-overrated',
    section: 'team',
    kind: 'single',
    prompt: '¿Qué equipo será el más sobrevalorado?',
    order: 9,
  },
  {
    id: 'manager-ranking',
    section: 'manager',
    kind: 'ranking',
    prompt: '¿Cómo terminará la clasificación final de mánagers?',
    order: 10,
  },
  {
    id: 'manager-round-wins',
    section: 'manager',
    kind: 'single',
    prompt: '¿Qué mánager ganará más jornadas?',
    order: 11,
  },
  {
    id: 'manager-best-round',
    section: 'manager',
    kind: 'single',
    prompt: '¿Qué mánager logrará la mayor puntuación en una jornada?',
    order: 12,
  },
] as const satisfies readonly PredictionQuestion[];

export type PredictionQuestionId = (typeof PREDICTION_QUESTIONS)[number]['id'];
export type PredictionAnswer = { kind: 'single'; id: string } | { kind: 'ranking'; ids: string[] };
export type PredictionAnswers = Partial<Record<PredictionQuestionId, PredictionAnswer>>;

export interface PredictionSection {
  id: PredictionSubject;
  title: string;
  description: string;
}

export const PREDICTION_SECTIONS: readonly PredictionSection[] = [
  { id: 'player', title: 'Jugadores', description: 'Talento, puntos y sorpresas de la temporada.' },
  {
    id: 'team',
    title: 'Equipos',
    description: 'La clasificación regular y el campeón de la EuroLeague.',
  },
  { id: 'manager', title: 'Mánagers', description: 'El desenlace de tu liga fantasy.' },
];
