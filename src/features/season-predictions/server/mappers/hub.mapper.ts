import { combineLeaderboard, type PhasePoints } from '../../models/leaderboard';
import { pickActivePhase, type PhaseResultsStatus, type PhaseState } from '../../models/phases';
import {
  scorePreseason,
  type PreseasonOutcomes,
  type QuestionOutcome,
} from '../../models/preseason-scoring';
import type { PredictionQuestion } from '../../models/questions';
import type { SeasonPredictionOptions } from '../../models/options';
import type { PlayoffsPageData, SeasonPredictionsPageData } from '../../models/submission';
import {
  PHASE_TITLES,
  type PhaseSummary,
  type PreseasonResultsView,
  type SeasonPredictionsHubData,
} from '../../models/hub';

const RANKING_PREVIEW = 3;

function namesFor(question: PredictionQuestion, options: SeasonPredictionOptions) {
  const choices =
    question.section === 'player'
      ? options.players
      : question.section === 'team'
        ? options.teams
        : options.managers;
  return new Map(choices.map((choice) => [choice.id, choice.name]));
}

function outcomeText(outcome: QuestionOutcome | undefined, names: Map<string, string>) {
  if (!outcome || outcome.status === 'pending') return null;
  const name = (id: string) => names.get(id) ?? 'Desconocido';
  if (outcome.kind === 'single') return outcome.leaderIds.map(name).join(' / ') || null;
  const top = outcome.standings
    .slice(0, RANKING_PREVIEW)
    .map(({ id, position }) => `${position}. ${name(id)}`);
  return top.length
    ? `${top.join(' · ')}${outcome.standings.length > RANKING_PREVIEW ? ' …' : ''}`
    : null;
}

function resultsStatus(scores: { provisional: boolean }, outcomes: PreseasonOutcomes) {
  const statuses = Object.values(outcomes).map((outcome) => outcome.status);
  if (statuses.every((status) => status === 'pending')) return 'pending' as const;
  return scores.provisional ? ('provisional' as const) : ('final' as const);
}

/**
 * Assembles the hub view model from both phase reads. Points are computed here at read
 * time; nothing is stored. Outcomes are only consulted once the preseason window locks.
 */
export function mapSeasonPredictionsHub(input: {
  preseason: SeasonPredictionsPageData;
  playoffs: PlayoffsPageData;
  outcomes: PreseasonOutcomes | null;
}): SeasonPredictionsHubData {
  const { preseason, playoffs, outcomes } = input;
  const preseasonLocked = preseason.status === 'locked' && outcomes !== null;

  let preseasonResults: PreseasonResultsView | null = null;
  let preseasonResultsStatus: PhaseResultsStatus = 'pending';
  const preseasonPoints = new Map<string, PhasePoints>();

  if (preseasonLocked) {
    const own = scorePreseason(preseason.submission?.answers ?? {}, outcomes);
    preseasonResultsStatus = resultsStatus(own, outcomes);
    preseasonResults = {
      points: own.points,
      provisional: own.provisional,
      questions: Object.fromEntries(
        preseason.questions.map((question) => {
          const score = own.questions[question.id];
          return [
            question.id,
            {
              scored: score?.scored ?? false,
              status: score?.status ?? 'pending',
              points: score?.points ?? 0,
              actual: outcomeText(outcomes[question.id], namesFor(question, preseason.options)),
            },
          ];
        })
      ),
    };
    for (const member of preseason.league ?? []) {
      const score = scorePreseason(member.answers, outcomes);
      preseasonPoints.set(member.userId, { points: score.points, provisional: score.provisional });
    }
  }

  const phases: PhaseSummary[] = [
    {
      phase: 'preseason',
      title: PHASE_TITLES.preseason,
      window: preseason.status,
      results: preseasonResultsStatus,
      opensAt: preseason.opensAt,
      locksAt: preseason.locksAt,
      locksAtLabel: preseason.locksAtLabel,
    },
    {
      phase: 'playoffs',
      title: PHASE_TITLES.playoffs,
      window: playoffs.status,
      results: 'pending',
      opensAt: playoffs.opensAt,
      locksAt: playoffs.locksAt,
      locksAtLabel: playoffs.locksAtLabel,
    },
  ];
  const states: PhaseState[] = phases.map(({ phase, window, results }) => ({
    phase,
    window,
    results,
  }));

  return {
    seasonId: preseason.seasonId,
    activePhase: pickActivePhase(states),
    phases,
    preseason,
    playoffs,
    preseasonResults,
    // Playoff points join the table with the bracket results view.
    leaderboard: preseasonLocked
      ? combineLeaderboard(
          (preseason.league ?? []).map(({ userId, name, image }) => ({ userId, name, image })),
          preseasonPoints,
          new Map()
        )
      : null,
  };
}
