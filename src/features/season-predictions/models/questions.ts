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
// Saved windows retain their own question IDs, including IDs retired from the current set.
export type PredictionAnswers = Record<string, PredictionAnswer>;

export interface PredictionSection {
  id: PredictionSubject;
  title: string;
  description: string;
}

const V1_SECTIONS: readonly PredictionSection[] = [
  { id: 'player', title: 'Jugadores', description: 'Talento, puntos y sorpresas de la temporada.' },
  {
    id: 'team',
    title: 'Equipos',
    description: 'La clasificación regular y el campeón de la EuroLeague.',
  },
  { id: 'manager', title: 'Mánagers', description: 'El desenlace de tu liga fantasy.' },
];

// Retain each released version's section copy when introducing another question set.
const SECTIONS_BY_VERSION: Readonly<Record<string, readonly PredictionSection[]>> = {
  'season-predictions-v1': V1_SECTIONS,
};

export function sectionsForQuestionSet(
  version: string | null,
  questions: readonly PredictionQuestion[]
): PredictionSection[] {
  const requestedVersion = version ?? QUESTION_SET_VERSION;
  const versioned = SECTIONS_BY_VERSION[requestedVersion];
  if (requestedVersion === QUESTION_SET_VERSION && !versioned)
    throw new Error(`Missing section metadata for ${QUESTION_SET_VERSION}`);
  const current = new Map(
    SECTIONS_BY_VERSION[QUESTION_SET_VERSION].map((section) => [section.id, section])
  );
  const selected = new Map(versioned?.map((section) => [section.id, section]));
  const orderedIds = Array.from(
    new Set([...questions].sort((a, b) => a.order - b.order).map((question) => question.section))
  );
  return orderedIds.map(
    (id) => selected.get(id) ?? current.get(id) ?? { id, title: id, description: '' }
  );
}
